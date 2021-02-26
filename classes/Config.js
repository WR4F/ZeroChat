const fs = require('fs')
const dotenv = require('dotenv').config()

let config = {
	DEFAULT_THEME: process.env.DEFAULT_THEME,
	DEFAULT_ROOM: process.env.DEFAULT_ROOM,

	DEFAULT_INLINE_PREVIEW: process.env.DEFAULT_INLINE_PREVIEW.toLowerCase() === 'true',

	HTTP_PORT: parseInt(process.env.HTTP_PORT), // also used directly as .env in the bin/www file
	HTTPS_PORT: parseInt(process.env.HTTPS_PORT), // also used directly as .env in the bin/www file

	SECRET_SALT: process.env.SECRET_SALT,
	themes: [],
	urlPrefix: '/', // not yet a variable
}

config.isValidTheme = (theme) => {
	if (config.themes.indexOf(theme) != -1) {
		return true
	} else {
		return false
	}
}

config.loadThemes = () => {
	return new Promise((resolve, reject) => {
		try {
			fs.readdir("public/themes", (err, files) => {
				config.themes = files.map(file => {
					if (file.endsWith(".css")) {
						return file.substr(0, file.length - 4)
					}
				});
				if (config.isValidTheme(config.DEFAULT_THEME)) {
					console.log("Themes loaded: " + config.themes);
					resolve(config.themes)
				} else {
					throw new Error("Default theme '" + config.DEFAULT_THEME + "' does not exist!")
				}
			});
		} catch (error) {
			reject(error)
		}
	})
}

config.loadConfig = () => {
	return new Promise((resolve, reject) => {
		if (config.urlPrefix === '/') config.urlPrefix = ''

		Promise.all([config.loadThemes()])
			.then(() => {
				resolve()
			})
			.catch((error) => {
				reject(error)
			})
	})
}

module.exports = config
