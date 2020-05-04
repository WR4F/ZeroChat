const fs = require('fs')

let config = {
	DEFAULT_THEME: "dark",
	THEMES: [],
}

config.loadThemes = () => {
	return new Promise((resolve, reject) => {
		try {
			fs.readdir("public/themes", (err, files) => {
				config.THEMES = files.map(file => {
					if (file.endsWith(".css")) {
						return file.substr(0, file.length - 4)
					}
				});
				resolve()
				console.log("Themes loaded: " + config.THEMES);
			});
		} catch (error) {
			exit(1)
		}
	})
}

config.isValidTheme = (theme) => {
	if (config.THEMES.indexOf(theme) != -1) {
		return true
	} else {
		return false
	}
}

module.exports = config
