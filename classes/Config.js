const fs = require('fs')

let config = {
	DEFAULT_THEME: "dark",
	themes: [],
	urlPrefix: '/',
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
			fs.readdir( "public/themes", (err, files) => {
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
			.then((themes)=>{
				resolve()
			})
			.catch((error) => {
				reject(error)
			})
	})
}

module.exports = config
