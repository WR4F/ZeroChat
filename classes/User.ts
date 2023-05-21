const express = require('express');
import { Request, Response } from 'express';

const Security = require("../utils/security")
const Config = require("../utils/configSetup")

type ChatStreams = {
	chatroom: Response,
	post: Response | null,
	upload: Response | null,
	chat: Response | null,
	settings: Response | null
}

// TODO: User input data needs sanitizing
/**
 * User objects hold user info for use in chat
 */
module.exports = class User {
	static DEFAULT_THEME = "dark"

	handle: String
	token: String
	tripcode: String
	theme: String
	notifications: String
	inlineView: Boolean | undefined
	room: Object
	frames: ChatStreams
	currPlaceholder: number
	joinTimeoutInterval: number | null

	static placeholderSequence = [
		"Type here, press [ENTER] to send...",
		"Use [TAB] so you don't need to click here to type...",
		"Press [TAB] after sending to type another message here...",
		""
	]

	constructor(handle: String, pass: String, chatSession: Response, theme: String, notifications: String, inlineView: Boolean, room: String) {
		this.handle = handle // screen name
		this.token = Security.dispenseToken() // session token
		this.tripcode = Security.genTripcode(pass) // identifying tripcode
		this.theme = theme // preferred theme
		this.notifications = notifications // notification preferences
		this.inlineView = (inlineView ? true : undefined)
		this.room = room // the room the user is in
		this.frames = { "chatroom": chatSession, "post": null, "upload": null, "chat": null, "settings": null } // response object
		this.currPlaceholder = 0
		this.joinTimeoutInterval = null
	}

	toString() {
		return JSON.stringify({ handle: this.handle, tripcode: this.tripcode })
	}

	// Update the user's current theme live
	setTheme(theme: String) {
		if (Config.isValidTheme(theme)) {
			this.theme = theme
			this.updateStream(`<link rel='stylesheet' href='${Config.urlPrefix}/themes/${this.theme}.css' />`)
		} else {
			throw new Error("Invalid theme '" + theme + "'")
		}
	}

	// Attempt to disconnect each page
	disconnect() {
		if (this.frames.chatroom) {
			try {
				this.frames.chatroom.end()
			} catch (error) { }
		}
		if (this.frames.post) {
			try {
				this.frames.post.end()
			} catch (error) { }
		}
		if (this.frames.upload) {
			try {
				this.frames.upload.end()
			} catch (error) { }
		}
		if (this.frames.chat) {
			try {
				this.frames.chat.end()
			} catch (error) { }
		}
		if (this.frames.settings) {
			try {
				this.frames.settings.end()
			} catch (error) { }
		}
	}

	nextMsgPlaceholder(request: Request) {
		let result = User.placeholderSequence[this.currPlaceholder]

		// Prepare for next time the placeholder is requested
		if (this.currPlaceholder <= User.placeholderSequence.length - 1) {
			this.currPlaceholder += 1
		}

		return result
	}

	// Update the open chatroom stream with HTML for this user
	updateStream(html: String) {
		if (this.frames.chat != null) {
			this.frames.chat.write(html)
		}
	}

}
