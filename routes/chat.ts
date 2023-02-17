import { Request, Response } from 'express'
const express = require("express")
const fileUploader = require('express-fileupload');
const User = require("../classes/User")
const ConfigSetup = require('../utils/configSetup')
const { DEFAULT_THEME, DEFAULT_ROOM, ROOMS, DEFAULT_INLINE_PREVIEW, ROUTES, VIEWS, ERRORS } = require('../utils/configSetup')
const Security = require('../utils/security')
// TODO gotta clean up unused things

// The exact amount of bytes (1024) needed for a browser to take our response
// seriously and begin rendering the HTML sent so far, immediately
const WHITESPACE_BITS = " ".repeat(1024) // For older Firefox versions, needed for them to start rendering

// TODO make some kind of configSetup var
const MAX_MESSAGE_LENGTH = 300
const MAX_FILE_SIZE = 10485760 // 10 Mb // TODO make some kind of configSetup var
const MAX_HANDLE_LENGTH = 15
const MAX_PASSCODE_LENGTH = 64
const MAX_ROOMNAME_LENGTH = 24
const URL_PREFIX = ConfigSetup.urlPrefix // TODO Support any prefix, replace all / in view files with var from cfg file
const CONNECT_DELAY_TIMEOUT = 20000 // How long to wait before disconnecting user if they never get past chatroom page
const PATHS = Object.values(ROUTES) // Array containing only the values of ROUTES

const BLACKLISTED_ROOM_NAMES = [
	'robots.txt',
	'favicon.ico',
	'public'
]

type FileUpload = {
	data: Buffer | string | null,
	type: string | null,
	name: string | null,
	mimetype: string | null,
	size: number | null,
	truncated: boolean | null,
	hrefImgId: string | null
}

interface ZCRequest extends Request {
	files: any, // express-fileupload adds this into the request
	file: FileUpload,
	message: string
}

let users: Array<typeof User> = []
let router = express.Router()

// FIXME bug where one user has "left" multiple times
const broadcast = async (user: typeof User | null, message: string, room: string, file: FileUpload | null | undefined = null) => {
	// A second check before sending. TODO It should not be possible to hit this branch, remove other checks elsewhere?
	if (message.trim() === '' && !file) {
		console.warn("User managed to send a post request with no file or message and pass initial checks!")
		user.disconnect()
		throw new Error("Message is blank or invalid")
	}

	if (file != null) {
		if (file.data && file.data.length !== 0 && file.name && file.mimetype) {
			file.data = file.data.toString("base64")
			file.type = file.mimetype.substr(0, file.mimetype.indexOf('/'))
			file.name = file.name
			file.mimetype = file.mimetype
			file.hrefImgId = ( file.type == "image" ? Math.random().toString(16) : "" )
		} else {
			return false // File is present but one of it's attributes is missing
		}
	} else {
		file = undefined // No file
	}

	for (const iUser of users) {
		if (iUser.room !== room) continue

		let postHandle = ""
		let postTrip = ""
		let messageType = "user"

		if (user === null) {
			messageType = "system" // If 'user' is null, it's a system message
		} else {
			if (user && user.token == iUser.token) {
				// User receiving own message
				postHandle = iUser.handle
				postTrip = iUser.tripcode
				messageType = "self"
			} else {
				// Other user receiving this message
				postHandle = user.handle
				postTrip = user.tripcode
			}
		}

		if (iUser.frames.chat) {
			iUser.frames.chat.render(VIEWS.NEW_MESSAGE,
				{
					handle: postHandle,
					tripcode: postTrip,
					messageType: messageType,
					message: message,
					inlineView: iUser.inlineView,
					timestamp: new Date().toUTCString(),
					file: file
				},
				(err: Error, html: string) => {
					iUser.frames.chat.write(html)
				})
		}
	}
}

const sanitizeRoomName = (room: string) => {
	room = room.trim().toLowerCase().replace(/[\\|\/]/g, "")
	room = decodeURI(room)

	while (room.charAt(0) === "_" || room.trim().length < room.length) {
		if (room.charAt(0) === "_") room = room.substr(1).trim()
		else room = room.trim()
	}

	// Use the default room if none is specified
	if (room == null) room = ''

	return room
}

const disconnectUser = (user: typeof User) => {
	let i = users.indexOf(user)

	if (i > -1) {
		// userFound = true
		let disconnectMsg = users[i].handle + " (" + users[i].tripcode + ") left."
		let room = user.room
		user.disconnect()
		user = null
		users.splice(i, 1)
		broadcast(null, disconnectMsg, room)
	}
}

let getUserByToken = (token: string) => {
	return users.filter((user) => user.token === token)[0]
}

let getUserByHandle = (handle: string, room: string) => {
	let user = undefined
	if (room) {
		user = users.filter((user) => user.handle === handle && user.room === room)[0]
	} else {
		user = users.filter((user) => user.handle === handle)[0]
	}
	return user
}

// Clean up request input
const sanitizeRequest = (req: ZCRequest) => {
	// Login sanitization
	if (req.body.handle && req.body.passcode) {
		req.body.handle = req.body.handle.trim()
		req.body.passcode = req.body.passcode.trim()
		req.body.room = sanitizeRoomName(req.body.room)
		if (req.body.room == "") req.body.room = sanitizeRoomName(DEFAULT_ROOM)
	}
	// Settings sanitization
	req.body.setSettings = (req.body.setSettings && req.body.setSettings.toString() == 'true')
	req.body.join = (req.body.join && req.body.join.toString() == 'true')
	return req
}

// Set headers
router.all("*", (req: ZCRequest, res: Response, next: Function) => {
	res.append("content-type", "text/html; charset=utf-8")
	req.socket.setKeepAlive(true) // prevent TCP connection from closing
	next()
})

// File upload handling
const filesLimitHandler = (req: ZCRequest, res: Response, next: Function) => {
	let user = getUserByToken(req.query.token as string)
	if (!user) { return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN) }

	if (req.files && Object.keys(req.files) && Object.keys(req.files).length > 1) {
		// Can only upload one file
		return res.render(VIEWS.LAYOUT, {
			page: VIEWS.ERROR_MESSAGE,
			url: "_hidden",
			error: "Cannot upload more than one file.",
			user: user,
			redirect: URL_PREFIX + ROUTES.WRITE_MESSAGE + "?token=" + req.body.token + (req.body.message ? "&msg=" + req.body.message : "")
		})
	} else {
		// File is too large
		return res.render(VIEWS.LAYOUT, {
			page: VIEWS.ERROR_MESSAGE,
			url: "_hidden",
			error: "Cannot upload files over " + MAX_FILE_SIZE / 1048576 + " MBs.",
			user: user,
			redirect: URL_PREFIX + ROUTES.WRITE_MESSAGE + "?token=" + req.body.token + (req.body.message ? "&msg=" + req.body.message : "")
		})
	}
}

router.use(fileUploader({ useTempFiles: false, limits: { files: 1, fileSize: 5242880 }, limitHandler: filesLimitHandler, }));

// POST REQUEST VALIDATION
// Uses "handle", "passcode", "room", "theme", "url"
router.post("*", async (req: ZCRequest, res: Response, next: Function) => {
	req = sanitizeRequest(req)

	if (req.files && req.files.fileupload) {
		if (req.files.fileupload.truncated) return; // File is too large
		req.file = req.files.fileupload as FileUpload
	}

	if (req.body != null && req.body.message != null && req.body.message.trim() != "")
		req.message = req.body.message

	let isPosting = false
	if (req.url.startsWith(URL_PREFIX + ROUTES.WRITE_MESSAGE))
		isPosting = true


	let user = getUserByToken(req.query.token as string) || undefined

	// Disconnect if message is too large
	if (req.message && req.message.length > MAX_MESSAGE_LENGTH) {
		// Message too large
		return res.render(VIEWS.LAYOUT, {
			page: VIEWS.ERROR_MESSAGE,
			url: "_hidden",
			error: "Message too long.",
			user: user,
			redirect: URL_PREFIX + ROUTES.WRITE_MESSAGE + "?token=" + req.body.token + (req.body.message ? "&msg=" + req.body.message : "")
		})
	}

	if (req.body.setSettings === true || req.body.join === true) {
		req.body.inlineView = (req.body.inlineView ? true : undefined)
		req.body.theme = req.body.theme.trim()
		// Check if invalid theme
		if (!ConfigSetup.isValidTheme(req.body.theme)) {
			return res.render(VIEWS.LAYOUT, {
				page: VIEWS.ERROR_MESSAGE,
				url: "_hidden",
				error: "Invalid theme",
				user: user,
				redirect: URL_PREFIX + ROUTES.SETTINGS + "?token=" + req.body.token
			})
		}
	}

	if (!isPosting && (req.file || req.message)) {
		// File request IS present, but for the wrong page
		return res.render(VIEWS.LAYOUT, {
			page: VIEWS.ERROR_MESSAGE,
			url: '_hidden',
			error: 'Cannot post to this page.',
			user: user,
			redirect: URL_PREFIX
		})
	} else if (isPosting) {
		if (!req.file && !req.message) {
			// No file or message present, but needed for the POST method on this page
			return res.render(VIEWS.LAYOUT, {
				page: VIEWS.ERROR_MESSAGE,
				url: '_hidden',
				error: 'Message or file required.',
				user: user,
				redirect: URL_PREFIX + ROUTES.WRITE_MESSAGE + "?token=" + req.body.token
			})
		}
		/* Viewing the post page and handling possible file uploads, good to continue */
		return next()
	} else if (req.url.substr(0, (URL_PREFIX + "_").length) !== URL_PREFIX + "_") {
		// Check whether the user is sending an update to their settings
		if (req.body.setSettings && req.body.join === undefined) {
			// Reload front page with settings applied
			return res.render(VIEWS.LAYOUT, {
				page: VIEWS.FRONT_PAGE,
				handleMaxlen: MAX_HANDLE_LENGTH,
				passMaxlen: MAX_PASSCODE_LENGTH,
				roomNameMaxlen: MAX_ROOMNAME_LENGTH,
				theme: req.body.theme || ConfigSetup.DEFAULT_THEME,
				inlineView: req.body.inlineView,
				setSettings: req.body.setSettings,
				url: sanitizeRoomName(req.url),
				rooms: ROOMS,
				defaultRoom: DEFAULT_ROOM
			})
		} else if (req.body.handle === ""
			|| req.body.passcode === "") {
			// FIXME Shouldn't this check if 'isPosting' is true? Or is this joining?
			// User is missing a required field
			return res.render(VIEWS.LAYOUT, {
				page: VIEWS.ERROR_MESSAGE,
				url: "_hidden",
				error: "Field missing",
				user: user,
				redirect: URL_PREFIX
			})
		} else if ((req.body.handle && req.body.handle.length > MAX_HANDLE_LENGTH)
			|| (req.body.passcode && req.body.passcode.length > MAX_PASSCODE_LENGTH)
			|| (req.body.room && req.body.room.length > MAX_ROOMNAME_LENGTH)) {
			// Disconnect if user is logging in with a name/passcode/room too long
			return res.render(VIEWS.LAYOUT, {
				page: VIEWS.ERROR_MESSAGE,
				url: "_hidden",
				error: "A field you entered was too long",
				user: user,
				redirect: URL_PREFIX
			})
		} else if (getUserByHandle(req.body.handle, req.body.room) != undefined) {
			// Disconnect user is their name is already taken
			return res.render(VIEWS.LAYOUT, {
				page: VIEWS.ERROR_MESSAGE,
				url: "_hidden",
				error: "Someone with that handle is already in /" + req.body.room,
				user: user,
				redirect: URL_PREFIX
			})
		}
	}
	next()
})

/* MAIN LOGIN PAGE */
let MAIN_LOGIN_REGEX = new RegExp(`${URL_PREFIX}(?!_).*`) // Matches /url but not /_url
router.get(MAIN_LOGIN_REGEX, (req: ZCRequest, res: Response, next: Function) => {
	req.url = sanitizeRoomName(req.url)
	if (BLACKLISTED_ROOM_NAMES.includes(req.url)) {
		return res.render(VIEWS.LAYOUT, {
			page: VIEWS.ERROR_MESSAGE,
			url: "_hidden",
			error: "Invalid room " + req.url,
			redirect: URL_PREFIX
		})
	}

	return res.render(VIEWS.LAYOUT, {
		page: VIEWS.FRONT_PAGE,
		handleMaxlen: MAX_HANDLE_LENGTH,
		passMaxlen: MAX_PASSCODE_LENGTH,
		roomNameMaxlen: MAX_ROOMNAME_LENGTH,
		theme: req.body.theme || ConfigSetup.DEFAULT_THEME,
		inlineView: (req.body.inlineView === undefined ? ConfigSetup.DEFAULT_INLINE_PREVIEW : req.body.inlineView),
		setSettings: req.body.setSettings,
		url: req.url,
		rooms: ROOMS,
		defaultRoom: DEFAULT_ROOM
	})
})

/* IFRAMES PRECHECK */
router.get(URL_PREFIX + "_*", (req: ZCRequest, res: Response, next: Function) => {
	// If we're supposed to load an iframe in the chatroom view
	let knownRoute = false
	const urlPath = req.url.substr(URL_PREFIX.length, (req.url.indexOf('?') != -1 ? req.url.indexOf('?') - 1 : req.url.length)).trim()
	for (const key in ROUTES) {
		if (urlPath == ROUTES[key]) {
			knownRoute = true
		}
	}
	if (!knownRoute) {
		return res.render(VIEWS.LAYOUT, {
			page: VIEWS.FRONT_PAGE,
			handleMaxlen: MAX_HANDLE_LENGTH,
			passMaxlen: MAX_PASSCODE_LENGTH,
			roomNameMaxlen: MAX_ROOMNAME_LENGTH,
			theme: req.body.theme || ConfigSetup.DEFAULT_THEME,
			inlineView: (req.body.inlineView === undefined ? ConfigSetup.DEFAULT_INLINE_PREVIEW : req.body.inlineView),
			setSettings: req.body.setSettings,
			url: sanitizeRoomName(req.url),
			rooms: ROOMS,
			defaultRoom: DEFAULT_ROOM
		})
	}

	if (req.query.token != null && req.query.token.length === Security.EXPECTED_TOKEN_LENGTH) {
		return next()
	} else {
		// Disconnect if the user is connecting to the upload form or chat without a token in the GET request
		return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN, () => req.destroy)
	}
})

/* WRITE MSG IFRAME */
router.get(URL_PREFIX + ROUTES.WRITE_MESSAGE, (req: ZCRequest, res: Response, next: Function) => {
	let user = getUserByToken(req.query.token as string)
	if (!user) { return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN) }
	user.frames.post = res
	let msg = req.query.msg as string
	if (msg == null || msg.trim() == "") msg = ""

	user.frames.post.render(VIEWS.LAYOUT, {
		page: VIEWS.WRITE_MESSAGE,
		user: user,
		maxlen: MAX_MESSAGE_LENGTH,
		msg: msg,
		placeholder: user.nextMsgPlaceholder(req)
	}, (err: Error, html: string) => { user.frames.post.end(html) })
})
/* SUBMITTING WRITE MSG IFRAME */
router.post(URL_PREFIX + ROUTES.WRITE_MESSAGE, (req: ZCRequest, res: Response, next: Function) => {
	let user = getUserByToken(req.body.token)
	if (!user) { return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN) }
	user.frames.post = res

	try {
		// Show the message to all users who have loaded the chatroom
		broadcast(user, req.body.message, user.room, req.file)
		user.frames.post.render(VIEWS.LAYOUT, {
			page: VIEWS.WRITE_MESSAGE,
			user: user,
			maxlen: MAX_MESSAGE_LENGTH,
			placeholder: user.nextMsgPlaceholder(req)
		}, (err: Error, html: string) => { return user.frames.post.end(html) })
	} catch (error) {
		console.error(error);
	}
})

/* CHATROOM */
router.post(URL_PREFIX + ROUTES.MAIN, (req: ZCRequest, res: Response, next: Function) => {
	let user: typeof User = null
	if (req.body.handle === undefined || req.body.passcode === undefined) {
		return res.render(VIEWS.ERROR, ERRORS.INVALID_REQUEST, () => res.end)
	}
	user = new User(req.body.handle, req.body.passcode, res, req.body.theme, req.body.inlineView, req.body.room)
	users.push(user)

	// Wait until the tripcode is done generating
	user.tripcode.then((trip: string) => {
		user.tripcode = trip
		user.frames.chatroom.render(
			VIEWS.LAYOUT,
			{
				page: VIEWS.CHATROOM,
				user: user,
				url: user.room,
				writemsg: URL_PREFIX + ROUTES.WRITE_MESSAGE,
				chatmsgs: URL_PREFIX + ROUTES.CHAT_MESSAGES,
				settingsPanel: URL_PREFIX + ROUTES.SETTINGS,
				snapbottom: true
			}
		)
	})

	// Timeout and delete the user if they connect to this page but never connect to the messages iframe
	user.joinTimeoutInterval = setInterval(() => {
		clearInterval(user.joinTimeoutInterval)
		disconnectUser(user)
	}, CONNECT_DELAY_TIMEOUT)
})

/* SETTINGS IFRAME */
router.get(URL_PREFIX + ROUTES.SETTINGS, (req: ZCRequest, res: Response, next: Function) => {
	let user = getUserByToken(req.query.token as string)
	if (!user) { return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN) }
	user.frames.settings = res

	user.frames.settings.render(
		VIEWS.LAYOUT,
		{
			page: VIEWS.SETTINGS,
			user: user,
			theme: user.theme,
			inlineView: user.inlineView,
			setSettings: req.body.setSettings,
			snapbottom: true,
			// redirect: URL_PREFIX + ROUTES.SETTINGS + "?token=" + req.query.token,
		},
		(err: Error, html: string) => { return user.frames.settings.end(html) }
	)
})
/* SUBMITTING SETTINGS IFRAME */
router.post(URL_PREFIX + ROUTES.SETTINGS, (req: ZCRequest, res: Response, next: Function) => {
	let user = getUserByToken(req.query.token as string)
	if (!user) { return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN) }
	user.frames.settings = res

	if (!req.body.setSettings) {
		return res.render(VIEWS.LAYOUT, {
			page: VIEWS.ERROR_MESSAGE,
			url: "_hidden",
			error: "Invalid request",
			user: user,
			redirect: URL_PREFIX + ROUTES.SETTINGS + "?token=" + req.query.token
		})
	}

	if (user.theme !== req.body.theme || user.inlineView !== req.body.inlineView) {
		try {
			user.setTheme(req.body.theme)
			user.inlineView = req.body.inlineView
			user.frames.settings.render(
				VIEWS.LAYOUT,
				{
					page: VIEWS.SETTINGS,
					user: user,
					theme: user.theme,
					inlineView: user.inlineView,
					setSettings: req.body.setSettings,
					snapbottom: true,
					// setSettings: true,
					redirect: URL_PREFIX + ROUTES.SETTINGS + "?token=" + req.query.token,
				},
				(err: Error, html: string) => { return user.frames.settings.end(html) }
			)
		} catch (error) {
			console.error(error)
			disconnectUser(user)
		}
	}
})

/* MESSAGES IFRAME (STREAMED) */
router.get(URL_PREFIX + ROUTES.CHAT_MESSAGES, (req: ZCRequest, res: Response, next: Function) => {

	// Find user
	let user = getUserByToken(req.query.token as string)
	if (!user) { return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN) }
	if (user.frames.chat != null) { return res.render(VIEWS.ERROR, ERRORS.DUPLICATE_CONNECTION) }
	user.frames.chat = res
	let keepAliveInterval: any // Function called at an interval defined later during render

	// On disconnect, remove the user entirely
	req.on("close", () => {
		if (keepAliveInterval) {
			clearInterval(keepAliveInterval)
		}
		disconnectUser(user)
	})

	user.frames.chat.render(VIEWS.LAYOUT, { page: VIEWS.VIEW_MESSAGES, user: user }, (err: Error, html: string) => {
		user.frames.chat.write(html)
		user.frames.chat.render(VIEWS.NEW_MESSAGE,
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
			(err: Error, html: string) => {
				user.frames.chat.write(html)
				user.frames.chat.write(WHITESPACE_BITS)
				keepAliveInterval = setInterval(() => {
					if (keepAliveInterval) user.frames.chat.write("\0") // null byte sent on an interval to the browser to keep the TCP connection alive
				}, 30000)
			})

		broadcast(null, user.handle + " (" + user.tripcode + ") joined /" + user.room + ".", user.room)

		// After having loaded the messages iframe, clear out the interval
		if (user.joinTimeoutInterval)
			clearInterval(user.joinTimeoutInterval)
	})
})

module.exports = router
