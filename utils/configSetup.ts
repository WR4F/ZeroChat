const fs = require('fs')
const dotenv = require('dotenv').config({ path: '.env' })

if (dotenv.error) { // .env missing, using .env.example
	console.info("INFO: .env file configuration missing, using defaults to listen on all interfaces on port 80");
	const dotenv_defaults = require('dotenv').config({ path: '.env.example' })
}

if (process.env.ROOMS && process.env.ROOMS.length == 0) {
	throw new Error("No rooms set in .env file.");
}

if (process.env.SECRET_SALT == "" || process.env.SECRET_SALT == null) {
	console.info("INFO: You are not using a salt for passcode hashing, a randomly generated salt will be used until you set a SECRET_SALT in the .env file and restart ZeroChat.");
}
const ROOMS: String[] = (process.env.ROOMS ? process.env.ROOMS.split(",") : [])
if (ROOMS.length == 0) {
	console.info("INFO: You have no rooms set for users to see publicly, none will be listed until you set a list of one or more comma separated ROOMS in the .env file and restart ZeroChat.");
}

let configData = {
	DEFAULT_THEME: process.env.DEFAULT_THEME || 'light',
	DEFAULT_ROOM: (ROOMS && ROOMS[0] ? ROOMS[0] : null),
	ROOMS: ROOMS,

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
		DUPLICATE_CONNECTION: { message: "Duplicate Connection", error: "403" },
		INVALID_REQUEST: { message: "Invalid Request", error: "400" },
	},

	DEFAULT_INLINE_PREVIEW: process.env.DEFAULT_INLINE_PREVIEW,

	ADDRESS: process.env.ADDRESS,
	HTTP_PORT: process.env.HTTP_PORT,
	HTTPS_PORT: process.env.HTTPS_PORT,
	USE_HTTPS: process.env.USE_HTTPS,
	
	HTTPS_PRIV_KEY: process.env.ENCRYPTION_HTTPS_PRIV_KEY,
	HTTPS_CERT: process.env.ENCRYPTION_HTTPS_CERT,
	
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
						console.log("Themes loaded: " + configData.themes + "(using theme " + configData.DEFAULT_THEME + " )");
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
