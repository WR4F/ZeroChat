const fs = require('fs')

let config = {
	DEFAULT_THEME: "dark",
<<<<<<< HEAD
	themes: [],
	urlPrefix: '/',
}

config.isValidTheme = (theme) => {
	if (config.themes.indexOf(theme) != -1) {
		return true
	} else {
		return false
	}
=======
	THEMES: [],
>>>>>>> 5c6dfbd5920bf2ec9a74a57a179bf49f0bf57b24
}

config.loadThemes = () => {
	return new Promise((resolve, reject) => {
		try {
<<<<<<< HEAD
			fs.readdir( "public/themes", (err, files) => {
				config.themes = files.map(file => {
=======
			fs.readdir("public/themes", (err, files) => {
				config.THEMES = files.map(file => {
>>>>>>> 5c6dfbd5920bf2ec9a74a57a179bf49f0bf57b24
					if (file.endsWith(".css")) {
						return file.substr(0, file.length - 4)
					}
				});
<<<<<<< HEAD
				if (config.isValidTheme(config.DEFAULT_THEME)) {
					console.log("Themes loaded: " + config.themes);
					resolve(config.themes)
				} else {
					throw new Error("Default theme '" + config.DEFAULT_THEME + "' does not exist!")
				}
			});
		} catch (error) {
			reject(error)
=======
				resolve()
				console.log("Themes loaded: " + config.THEMES);
			});
		} catch (error) {
			exit(1)
>>>>>>> 5c6dfbd5920bf2ec9a74a57a179bf49f0bf57b24
		}
	})
}

<<<<<<< HEAD
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
=======
config.isValidTheme = (theme) => {
	if (config.THEMES.indexOf(theme) != -1) {
		return true
	} else {
		return false
	}
>>>>>>> 5c6dfbd5920bf2ec9a74a57a179bf49f0bf57b24
}

module.exports = config
