const express = require("express")
const fs = require('fs')
const User = require("../classes/User")
const config = require('../classes/Config')

// support multipart/form-data
const multer = require("multer")

// The exact amount of bytes (1024 + 1) needed for a browser to take our (incomplete) response seriously
// and begin rendering the HTML sent so far, immediately
const WHITESPACE_BITS =
	"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 "

const DEFAULT_ROOM = "hallway" // TODO when loading from file, needs to be sanitized
const MAX_MESSAGE_LENGTH = 300
const MAX_FILE_SIZE = 5242880 // 5 Mb
const MAX_HANDLE_LENGTH = 15
const MAX_PASSCODE_LENGTH = 64
const MAX_ROOMNAME_LENGTH = 24
const EXPECTED_TOKEN_LENGTH = 60 // length of crypto.js hash
const URL_PREFIX = '/' // TODO support any prefix, replace all / in ejs files with var from cfg file
const ROUTES = {
	MAIN: '',
	POST_MESSAGE: '_post-message',
	UPLOAD_FILE: '_upload-file',
	CHAT_MESSAGES: '_view-messages',
	SETTINGS: '_settings',
}
const PATHS = Object.values(ROUTES) // Array containing only the values of ROUTES

const VIEWS = {
	LAYOUT: 'layout',
	FRONT_PAGE: 'index',
	CHATROOM: 'chatroom',
	ERROR: 'error',
	WRITE_MESSAGE: 'write-message',
	UPLOAD: 'upload-file',
	NEW_MESSAGE: 'new-message',
	VIEW_MESSAGES: 'view-messages',
	ERROR_MESSAGE: 'error-message',
}

const ERRORS = {
	INVALID_TOKEN: { message: "Invalid Token", error: "401" },
	INVALID_REQUEST: { message: "Invalid Request", error: "400" },
}

const FALLBACK_DEFAULT_ROOM = ["Hallway"]
const ROOMS_FILE = "rooms.txt"

let storage = multer.memoryStorage()
let upload = multer({ storage: storage, limits: { fileSize: MAX_FILE_SIZE, files: 1 } })

let roomsList = []
let users = []
let router = express.Router()

const getRooms = () => {
	return new Promise((resolve, reject) => {
		fs.readFile(ROOMS_FILE, 'utf8', (err, data) => {
			if (err) throw err;
			if (data == null || data == []) {
				console.error("Error: " + ROOMS_FILE + " is empty or invalid, it should be a list of default rooms seperated by lines. Defaulting to /" + FALLBACK_DEFAULT_ROOM[0]);
				reject()
				process.exit(1)
			} else {
				resolve(data.split(/\r?\n/))
			}
		})
	})
}

const broadcast = (user, message, room, file = undefined) => {
	return new Promise((resolve, reject) => {

		// A second check before sending. It should not be possible to hit this branch
		if ((typeof message != "string" || message.trim() == '') && !file) {
			reject("Message is blank or invalid")
			console.warn("User managed to send a post request with no file or message and pass inital checks!");
			return user.disconnect()
		}

		// TODO Extend this to support showing images or files in different ways
		let fileData = {
			buffer: undefined,
			type: undefined,
			name: undefined,
			mimetype: undefined
		}
		if (file) {
			fileData.buffer = file.buffer.toString("base64")
			fileData.type = file.mimetype.substr(0, file.mimetype.indexOf('/'))
			fileData.name = file.originalname
			fileData.mimetype = file.mimetype
		}
		for (const iUser of users) {
			if (iUser.room !== room) {
				continue
			}
			let messageType = "user"
			let postHandle = ""
			let postTrip = ""
			if (user == null) { // If the 'user' param is null, that means it's a system message
				messageType = "system"
			} else {
				postHandle = user.handle
				postTrip = user.tripcode
			}

			if (iUser.res.messages) {
				if (user && user.token == iUser.token) { // Same user who wrote the message
					iUser.res.messages.render(VIEWS.NEW_MESSAGE,
						{
							handle: iUser.handle,
							tripcode: iUser.tripcode,
							messageType: "self",
							message: message,
							timestamp: new Date().toUTCString(),
							file: fileData.buffer,
							filetype: fileData.type,
							filename: fileData.name,
							mimetype: fileData.mimetype
						},
						(err, html) => {
							iUser.res.messages.write(html)
						})
				} else { // Other user in chat
					iUser.res.messages.render(VIEWS.NEW_MESSAGE,
						{
							handle: postHandle,
							tripcode: postTrip,
							messageType: messageType,
							message: message,
							timestamp: new Date().toUTCString(),
							file: fileData.buffer,
							filetype: fileData.type,
							filename: fileData.name,
							mimetype: fileData.mimetype
						},
						(err, html) => {
							iUser.res.messages.write(html)
						})
				}
			}
		}
		resolve('success')
	})
}

let sanitizeRoomName = (room) => {

	room = room.trim().toLowerCase().replace(/[\\|\/]/g, "")
	room = decodeURI(room)
	if (room.charAt(0) === "_") {
		room = room.substr(1).trim()
	}
	// TODO: check if room is NOT in list of invalid rooms, return -1 if it is
	return room
}

let isUsedPath = (url) => {
	let matching = PATHS.filter(path => {
		return (URL_PREFIX + path) == url
	})

	if (matching.length == 0) {
		return false
	} else {
		return true
	}
}

let disconnectUser = (user) => {
	let i = users.indexOf(user)
	if (i > -1) {
		userFound = true
		let disconnectMsg = users[i].handle + " (" + users[i].tripcode + ") left."
		let room = user.room
		user.disconnect()
		user = null
		users.splice(i, 1)
		broadcast(null, disconnectMsg, room)
	}
	return
}

let getUserByToken = (token) => {
	return users.filter((user) => user.token === token)[0]
}

let getUserByHandle = (handle, room) => {
	let user = undefined
	if (room) {
		user = users.filter((user) => user.handle === handle && user.room === room)[0]
	} else {
		user = users.filter((user) => user.handle === handle)[0]
	}
	return user
}

router.errorWithPostToken = (err, req, res) => {
	let user = getUserByToken(req.body.token)
	if (!user) { return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN) }

	return res.render(VIEWS.LAYOUT, {
		page: VIEWS.ERROR_MESSAGE,
		url: "_hidden",
		error: err.message,
		user: user,
		redirect: URL_PREFIX + ROUTES.UPLOAD_FILE + "?token=" + req.body.token
	})
}

// Set headers
router.all("*", (req, res, next) => {
	res.append("content-type", "text/html; charset=utf-8")
	// res.setTimeout(0) // no timeout in HTTP headers
	req.socket.setKeepAlive(true) // prevent TCP connection from closing

	next()
})

// POST REQUEST VALIDATION
// Uses "handle", "passcode", "room", "theme", "url"
router.post("*", upload.single('fileupload'), (req, res, next) => {
	if (req.body.handle && req.body.passcode && req.body.theme) {
		req.body.handle = req.body.handle.trim()
		req.body.passcode = req.body.passcode.trim()
		req.body.theme = req.body.theme.trim()
		req.body.room = sanitizeRoomName(req.body.room)

		if (!config.isValidTheme(req.body.theme)) {
			return res.render(VIEWS.LAYOUT, {
				page: VIEWS.ERROR_MESSAGE,
				url: "_hidden",
				error: "Invalid theme",
				redirect: URL_PREFIX
			})
		}

		// No room selected? Use the default one, if any
		if (req.body.room === "" && DEFAULT_ROOM) {
			req.body.room = DEFAULT_ROOM
		}
	}

	if (req.url.substr(0, 2) !== URL_PREFIX + "_") {
		// Disconnect if user is logging in with a name/passcode too long or blank
		if (
			(req.body.handle === ""
				|| req.body.passcode === ""
				|| req.body.room === "")) {
			// return res.render(VIEWS.ERROR, ERRORS.INVALID_REQUEST, (err, html) => res.end(html + "Field cannot be blank"))
			return res.render(VIEWS.LAYOUT, {
				page: VIEWS.ERROR_MESSAGE,
				url: "_hidden",
				error: "Message too long",
				redirect: URL_PREFIX
			})
		} else if (req.body.handle.length > MAX_HANDLE_LENGTH
			|| req.body.passcode.length > MAX_PASSCODE_LENGTH
			|| req.body.room.length > MAX_ROOMNAME_LENGTH) {
			// return res.render(VIEWS.ERROR, ERRORS.INVALID_REQUEST, (err, html) => res.end(html + "Field too long"))
			return res.render(VIEWS.LAYOUT, {
				page: VIEWS.ERROR_MESSAGE,
				url: "_hidden",
				error: "A field you entered was too long.",
				redirect: URL_PREFIX
			})
		} else if (getUserByHandle(req.body.handle, req.body.room) != undefined) {
			// return res.render(VIEWS.ERROR, ERRORS.INVALID_REQUEST, (err, html) => res.end(html + "Name taken"))
			return res.render(VIEWS.LAYOUT, {
				page: VIEWS.ERROR_MESSAGE,
				url: "_hidden",
				error: "Someone with that handle is already in /" + req.body.room,
				redirect: URL_PREFIX
			})
		}
	} else if (req.url.startsWith(URL_PREFIX + ROUTES.POST_MESSAGE)) {
		let user = getUserByToken(req.query.token)
		if (!user) { return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN) }

		// Disconnect if user is sending a blank message without a file, or a message too large
		if (req.body.message.length > MAX_MESSAGE_LENGTH) {
			// message too large
			return res.render(VIEWS.LAYOUT, {
				page: VIEWS.ERROR_MESSAGE,
				url: "_hidden",
				error: "Message too long",
				user: user,
				redirect: URL_PREFIX + ROUTES.POST_MESSAGE + "?token=" + req.query.token
			})
		} else if ((req.body.message == null || req.body.message.trim() == "") && req.file == null) {
			// no message
			return res.render(VIEWS.LAYOUT, {
				page: VIEWS.ERROR_MESSAGE,
				url: "_hidden",
				error: "Message required",
				user: user,
				redirect: URL_PREFIX + ROUTES.POST_MESSAGE + "?token=" + req.query.token
			})
		}
	} else if (req.url.startsWith(URL_PREFIX + ROUTES.UPLOAD_FILE)) {
		let user = getUserByToken(req.query.token)
		if (!user) { return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN) }

		if (req.file == null) {
			// file required
			return res.render(VIEWS.LAYOUT, {
				page: VIEWS.ERROR_MESSAGE,
				url: "_hidden",
				error: "No file chosen",
				user: user,
				redirect: URL_PREFIX + ROUTES.UPLOAD_FILE + "?token=" + req.query.token
			})
		} else if (req.file != null && req.file.size > MAX_FILE_SIZE) {
			// file too large
			return res.render(VIEWS.LAYOUT, {
				page: VIEWS.ERROR_MESSAGE,
				url: "_hidden",
				error: "File too large",
				user: user,
				redirect: URL_PREFIX + ROUTES.UPLOAD_FILE + "?token=" + req.query.token
			})
		}
	}
	next()
})

/* MAIN LOGIN PAGE */
let MAIN_LOGIN_REGEX = new RegExp(`${URL_PREFIX}(?!_).*`); // Matches /url but not /_url
router.get(MAIN_LOGIN_REGEX, (req, res, next) => {
	req.url = sanitizeRoomName(req.url)

	return res.render(VIEWS.LAYOUT, {
		page: VIEWS.FRONT_PAGE,
		handleMaxlen: MAX_HANDLE_LENGTH,
		passMaxlen: MAX_PASSCODE_LENGTH,
		roomNameMaxlen: MAX_ROOMNAME_LENGTH,
		theme: User.DEFAULT_THEME,
		url: req.url,
		rooms: roomsList
	}, (err, html) => {
		res.end(html)
	})
})

/* IFRAMES PRECHECK */
router.get(URL_PREFIX + "_*", (req, res, next) => {
	// If we're supposed to load an iframe in the chatroom view
	if (req.query.token != null && req.query.token.length === EXPECTED_TOKEN_LENGTH) {
		next()
	} else {
		// Disconnect if the user is connecting to the upload form or chat without a token in the GET request
		return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN, req.destroy())
	}
})

/* CHATROOM */
router.post(URL_PREFIX + ROUTES.MAIN, (req, res, next) => {
	let user = null
	if (req.body.handle === undefined || req.body.passcode === undefined) {
		return res.render(VIEWS.ERROR, ERRORS.INVALID_REQUEST, res.end())
	}
	user = new User(req.body.handle, req.body.passcode, res, req.body.theme, req.body.room)
	users.push(user)

	// Wait until the tripcode is done generating
	user.tripcode.then((trip) => {
		user.tripcode = trip
		user.res.chatroom.render(
			VIEWS.LAYOUT,
			{
				page: VIEWS.CHATROOM,
				user: user,
				url: user.room,
				postmsg: URL_PREFIX + ROUTES.POST_MESSAGE,
				uploadfile: URL_PREFIX + ROUTES.UPLOAD_FILE,
				chatmsgs: URL_PREFIX + ROUTES.CHAT_MESSAGES
			},
			(err, html) => { user.res.chatroom.end(html) }
		)
	})
	// TODO: gotta timeout and delete the user if they connect to this page but never connect to the messages iframe
})

/* POST MSG IFRAME */
router.get(URL_PREFIX + ROUTES.POST_MESSAGE, (req, res, next) => {
	let user = getUserByToken(req.query.token)
	if (!user) { return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN) }
	user.res.post = res

	user.res.post.render(VIEWS.LAYOUT, {
		page: VIEWS.WRITE_MESSAGE,
		user: user,
		maxlen: MAX_MESSAGE_LENGTH,
		placeholder: user.nextMsgPlaceholder(req)
	}, (err, html) => { user.res.post.end(html) })
})

/* SUBMITTING POST MSG IFRAME */
router.post(URL_PREFIX + ROUTES.POST_MESSAGE, (req, res, next) => {
	let user = getUserByToken(req.body.token)
	if (!user) { return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN) }
	user.res.post = res

	// Show the message to all users who have loaded the chatroom
	broadcast(user, req.body.message, user.room)
		.then((status) => {
			// Went ok
			return status
		})
		.catch((status) => {
			// TODO: Issue occurs?, address problem
			return status
		})
		.finally((status) => {
			user.res.post.render(VIEWS.LAYOUT, {
				page: VIEWS.WRITE_MESSAGE,
				user: user,
				maxlen: MAX_MESSAGE_LENGTH,
				placeholder: user.nextMsgPlaceholder(req)
			}, (err, html) => { return user.res.post.end(html) })
		})
})


/* UPLOAD FILE IFRAME */
router.get(URL_PREFIX + ROUTES.UPLOAD_FILE, (req, res, next) => {
	let user = getUserByToken(req.query.token)
	if (!user) { return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN) }
	user.res.upload = res

	user.res.upload.render(
		VIEWS.LAYOUT,
		{
			page: VIEWS.UPLOAD,
			user: user
		},
		(err, html) => { user.res.upload.end(html) }
	)
})

/* SUBMITTING UPLOAD FILE IFRAME */
router.post(URL_PREFIX + ROUTES.UPLOAD_FILE, (req, res, next) => {
	let user = getUserByToken(req.body.token)
	if (!user) { return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN) }
	user.res.post = res

	// Show the file to all users who have loaded the chatroom
	broadcast(user, "", user.room, req.file)
		.then((status) => {
			// Went ok
			return status
		})
		.catch((status) => {
			// TODO: Issue occurs?, address problem
			return status
		})
		.finally((status) => {
			user.res.post.render(VIEWS.LAYOUT, {
				page: VIEWS.UPLOAD,
				user: user
			}, (err, html) => { return user.res.post.end(html) })
		})
})


/* MESSAGES IFRAME */
router.get(URL_PREFIX + ROUTES.CHAT_MESSAGES, (req, res, next) => {

	// Find user
	let user = getUserByToken(req.query.token)
	if (!user) { return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN) }
	user.res.messages = res

	// On disconnect, cancel ping keep-alive and remove user from list
	req.on("close", () => {
		// clearInterval(pingInterval)
		disconnectUser(user)
	})

	user.res.messages.render(VIEWS.LAYOUT, { page: VIEWS.VIEW_MESSAGES, user: user }, (err, html) => {
		user.res.messages.write(html)
		user.res.messages.render(VIEWS.NEW_MESSAGE,
			{
				handle: "",
				tripcode: "",
				messageType: "system",
				message: "Users online: " +
					users
						.filter((iUser) => iUser.room === user.room)
						.map((iUser) => iUser.handle)
						.join(', '),
				user: user,
				timestamp: new Date().toUTCString()
			},
			(err, html) => {
				user.res.messages.write(html)
				user.res.messages.write(WHITESPACE_BITS) // Firefox needs extra data sent to render the document properly
			})

		broadcast(null, user.handle + " (" + user.tripcode + ") joined /" + user.room + ".", user.room)

		// A keep-alive ping, to prevent the connection from dropping (usually not needed)
		// pingInterval = setInterval(() => {
		// 	user.res.messages.ping()
		// }, 20000)
	})
})

getRooms().then(data => roomsList = data)
module.exports = router