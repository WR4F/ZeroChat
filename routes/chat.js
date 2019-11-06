const express = require("express")
const User = require("../classes/User")

const WHITESPACE_BITS =
	"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 "

const URL_PREFIX = '/'
const ROUTES = {
	MAIN: '',
	UPLOAD_MESSAGE: 'upload-message',
	CHAT_MESSAGES: 'messages'
}
const PATHS = Object.values(ROUTES) // Array containing only the values of ROUTES

const VIEWS = {
	LAYOUT: 'layout',
	FRONT_PAGE: 'index',
	CHATROOM: 'chatroom',
	ERROR: 'error',
	WRITE_MESSAGE: 'write-message',
	NEW_MESSAGE: 'new-message',
	VIEW_MESSAGES: 'messages',
}

const ERRORS = {
	INVALID_TOKEN: { message: "Invalid Token", error: "401" },
	INVALID_REQUEST: { message: "Invalid Request", error: "400" },
}

let users = []

let router = express.Router()


const broadcast = (user, message) => {
	return new Promise((resolve, reject) => {
		if (typeof message != "string" || message.trim() == '') {
			reject("Message is blank or invalid")
		}
		for (const iUser of users) {
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
							timestamp: new Date().toUTCString()
						},
						(err, html) => {
							iUser.res.messages.write(html)
						})
				} else {
					iUser.res.messages.render(VIEWS.NEW_MESSAGE,
						{
							handle: postHandle,
							tripcode: postTrip,
							messageType: messageType,
							message: message,
							timestamp: new Date().toUTCString()
						},
						(err, html) => {
							iUser.res.messages.write(html)
						})
				}
			}
			resolve('success')
		}
	})
}

var isValidPath = (url) => {
	var matching = PATHS.filter(path => {
		return (URL_PREFIX + path) == url
	})

	if (matching.length == 0) {
		return false
	} else {
		return true
	}
}


router.use((req, res, next) => {
	if (isValidPath(req.url)) {
		res.append("content-type", "text/html; charset=utf-8")
		res.setTimeout(0) // no timeout
		req.socket.setKeepAlive(true) // prevent TCP connection from closin
		// res.write(WHITESPACE_BITS) // For all pages to load even though no data has been sent yet
	}

	next()
})


/* MAIN PAGE */
router.get(URL_PREFIX + ROUTES.MAIN, (req, res, next) => {
	return res.render(VIEWS.LAYOUT, { page: VIEWS.FRONT_PAGE }, (err, html) => { res.end(html) })
})

/* CHATROOM */
router.post(URL_PREFIX + ROUTES.MAIN, (req, res, next) => {

	let user = null

	if (req.body.handle === undefined || req.body.passcode === undefined) {
		return res.render(VIEWS.ERROR, ERRORS.INVALID_REQUEST, res.end())
	}

	user = new User(req.body.handle, req.body.passcode, res)
	users.push(user)

	// Wait until the tripcode is done generating
	user.tripcode.then((trip) => {
		user.tripcode = trip
		user.res.chatroom.render(
			VIEWS.LAYOUT,
			{
				page: VIEWS.CHATROOM,
				handle: user.handle,
				token: user.token,
			},
			(err, html) => {
				user.res.chatroom.end(html)
			}
		)
	})
})

/* UPLOAD MSG IFRAME */
router.get(URL_PREFIX + ROUTES.UPLOAD_MESSAGE, (req, res, next) => {
	let user = users.filter((user) => {
		if (user.token == req.query.token) {
			return user.res.post = res
		}
	})[0]

	if (!user) {
		return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN)
	}


	user.res.post.render(VIEWS.LAYOUT, { page: VIEWS.WRITE_MESSAGE, theme: user.theme, handle: user.handle, token: user.token },
		(err, html) => {
			user.res.post.end(html)
		})
})

/* SUBMITTING UPLOAD MSG IFRAME */
router.post(URL_PREFIX + ROUTES.UPLOAD_MESSAGE, (req, res, next) => {
	let user = users.filter((user) => {
		if (user.token == req.body.token) {
			return user.res.post = res
		}
	})[0]

	if (!user) {
		return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN)
	}

	// Show the message to all users who have loaded the chatroom
	broadcast(user, req.body.message)
		.then((status) => {
			user.res.post.render(VIEWS.LAYOUT, { page: VIEWS.WRITE_MESSAGE, theme: user.theme, handle: user.handle, token: user.token },
				(err, html) => { return user.res.post.end(html) })
		})
		.catch((status) => {
			user.res.post.render(VIEWS.LAYOUT, { page: VIEWS.WRITE_MESSAGE, theme: user.theme, handle: user.handle, token: user.token },
				(err, html) => { return user.res.post.end(html) })
		})

})

/* MESSAGES IFRAME */
router.get(URL_PREFIX + ROUTES.CHAT_MESSAGES, (req, res, next) => {

	let pingInterval

	req.on("close", () => {
		clearInterval(pingInterval)
		res.end()
		let i = users.indexOf(user)
		if (i > -1) {
			let disconnectMsg = users[i].handle + " (" + users[i].tripcode + ") left."
			user = null
			users.splice(i, 1)
			broadcast(null, disconnectMsg)
		}
		return
	})

	let user = users.filter((user) => {
		if (user.token == req.query.token) {
			return user.res.messages = res
		}
	})[0]

	if (!user) {
		return res.render(VIEWS.ERROR, ERRORS.INVALID_TOKEN)
	}

	user.res.messages.render(VIEWS.LAYOUT, { page: ROUTES.CHAT_MESSAGES }, (err, html) => {
		user.res.messages.write(html)
		user.res.messages.render(VIEWS.NEW_MESSAGE,
			{
				handle: "",
				tripcode: "",
				messageType: "system",
				message: "Users online: " + (users.map((user) => user.handle)).join(', '),
				timestamp: new Date().toUTCString()
			},
			(err, html) => {
				user.res.messages.write(html)
				user.res.messages.write(WHITESPACE_BITS) // Firefox needs extra data sent to render the document properly
			})
		broadcast(null, user.handle + " (" + user.tripcode + ") joined.")

		// A keep-alive ping, to prevent the connection from dropping
		pingInterval = setInterval(() => {
			user.res.messages.write(' ')
		}, 1000)
	})
})

module.exports = router
