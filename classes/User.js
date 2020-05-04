const crypto = require("../crypto")

// TODO: User input data needs sanitizing
/**
 * User objects hold user info for use in chat
 */
module.exports = class User {
	static DEFAULT_THEME = "dark"

	static placeholderSequence = [
		"Type here, press [ENTER] to send...",
		"Press [TAB] to type another message here...",
		""
	]

	constructor(handle, pass, res, theme, room) {
		this.handle = handle // screen name
		this.token = crypto.dispenseToken() // session token
		this.tripcode = crypto.genTripcode(pass) // identifying tripcode
		this.theme = theme // preferred theme
		this.room = room // the room the user is in
		this.res = { "chatroom": res, "post": null, "upload": null, "messages": null } // response object
		this.placeholderIter = 0
	}
	toString() {
		return '{"handle":"' + this.handle + '","tripcode":"' + this.tripcode + '"}'
	}

	nextMsgPlaceholder(req) {
		let result = User.placeholderSequence[this.placeholderIter]

		// Prepare for next time the placeholder is requested
		if (this.placeholderIter === 0 /*&& req.headers['user-agent'].indexOf("Firefox") !== -1*/) {
			this.placeholderIter++
		} else {
			this.placeholderIter = 2
		}

		return result
	}

	// Attempt to disconnect each page
	disconnect() {
		if (this.res.chatroom) {
			try {
				this.res.chatroom
			} catch (error) { }
		}
		if (this.res.post) {
			try {
				this.res.post
			} catch (error) { }
		}
		if (this.res.upload) {
			try {
				this.res.messages
			} catch (error) { }
		}
		if (this.res.messages) {
			try {
				this.res.messages
			} catch (error) { }
		}
	}
}
