const fs = require('fs')
const dotenv = require('dotenv').config()
const ConfigJSON = require('../config.json')

let configData = {
	DEFAULT_THEME: ConfigJSON.CHAT.DEFAULT_THEME,
	DEFAULT_ROOM: ConfigJSON.ROOMS[0],
	ROOMS: ConfigJSON.ROOMS,

	ROUTES: {
		MAIN: '',
		WRITE_MESSAGE: '_write-message',
		CHAT_MESSAGES: '_view-messages',
		SETTINGS: '_settings',
	},

	VIEWS: {
		LAYOUT: 'layout',
		FRONT_PAGE: 'index',
		CHATROOM: 'chatroom',
		ERROR: 'error',
		WRITE_MESSAGE: 'write-message',
		NEW_MESSAGE: 'new-message',
		VIEW_MESSAGES: 'view-messages',
		ERROR_MESSAGE: 'error-message',
		SETTINGS: 'settings',
	},

	ERRORS: {
		INVALID_TOKEN: { message: "Invalid Token", error: "401" },
		INVALID_REQUEST: { message: "Invalid Request", error: "400" },
	},

	DEFAULT_INLINE_PREVIEW: ConfigJSON.CHAT.DEFAULT_INLINE_PREVIEW,

	ADDRESS: ConfigJSON.HTTP.ADDRESS,
	HTTP_PORT: ConfigJSON.HTTP.HTTP_PORT,
	HTTPS_PORT: ConfigJSON.HTTP.HTTPS_PORT,
	USE_HTTPS: ConfigJSON.HTTP.USE_HTTPS,

	// Either use a secret salt or a random string
	SECRET_SALT: process.env.SECRET_SALT || Math.random().toString(36).substring(16),
	themes: [] as String[],
	urlPrefix: '/', // not yet a variable
	isValidTheme: (theme: String) => {
		if (configData.themes.includes(theme)) {
			return true
		} else {
			return false
		}
	},
	loadThemes: () => {
		return new Promise((resolve, reject) => {
			try {
				fs.readdir("public/themes", (err: Error, files: Array<String>) => {
					files.forEach(file => {
						if (file.endsWith(".css")) configData.themes.push(file.substr(0, file.length - 4))
					})

					if (configData.isValidTheme(configData.DEFAULT_THEME)) {
						console.log("Themes loaded: " + configData.themes);
						resolve(configData.themes)
					} else {
						throw new Error("Default theme '" + configData.DEFAULT_THEME + "' does not exist!")
					}
				})
			} catch (error) {
				reject(error)
			}
		})
	},
	loadConfig: () => {
		return new Promise((resolve, reject) => {
			if (configData.urlPrefix === '/') configData.urlPrefix = ''
			Promise.all([configData.loadThemes()])
				.then(() => {
					resolve(true)
				})
				.catch((error) => {
					reject(error)
				})
		})
	}
}

module.exports = configData
