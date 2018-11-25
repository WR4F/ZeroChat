const http = require('http')
const express = require('express');
const qs = require('querystring')
const crypto = require('crypto')

const PORT = 8080
const HTMLHEADERS = {
	'Content-Type': 'text/html; charset=utf-8'
}
const CRYPTO_ITERATIONS = 10000
const SALT = 'default'
const DIGEST = 'sha256'
const HASH_LENGTH = 6
const KEY_LENGTH = 30

const HTML_SEND_BUTTON = `<input tabindex="2" type="submit" value="Send">`
const HTML_JOIN_BUTTON = `<input tabindex="3" type="submit" value="Join chat">`
const CSS_RESET = `<style>
body{padding:0}
*{
	font-family:sans-serif;border:0;margin:0;font-size:100%
}
a {
	color: blue;
	text-decoration:underline;
}
a:visited {
	color: purple;
}
input, textarea, select {
	-moz-appearance: initial;
	-webkit-appearance: initial;
	appearance:initial;
}
*:focus {
	background-color: initial;
}
</style>`
const BASE_CSS = `<style>
body{
	padding: 0;
}
#checkshow,#checkshow + label{
	cursor:pointer
}
input, textarea, select, option{
	margin: 0;
	padding: initial;
}
#checkshow + label{
	position: initial;
	top: auto;
	right: auto;
	left: auto;
	padding: 0;
	background-color: transparent;
	width: initial;
	text-align: center;
}
#checkshow:checked + label {
	background-color: transparent;
}
#settings{
	position: absolute;
	top: auto;
	right: auto;
	left: auto;
	background-color:snow;
}
#messagebox{
	width: 600px;
	height: 45px;
	margin-right:5px;
	float: left;
}
#settings_options, #checkshow{
	display:none;
}

#checkshow + label:before,#checkshow + label::before{
	content:"⚙ ";
	color: slategray;
}
#checkshow + label:after,#checkshow + label::after{
	content:" Settings";
	color: slategray;
}

#checkshow:checked  + label:before,#checkshow:checked  + label::before{
	content:"✖ ";
	color: crimson;
}
#checkshow:checked + label:after,#checkshow:checked + label::after{
	content:" Close";
	color: crimson;
}

#checkshow:checked + label + #settings_options{
	display:block;
}
#chat{
	padding: 25px;
}
#settings_options {
	width: 700px;
	height: 600px;
}`

const CSS_THEMES = {
	// DEBUG THEME <START>
	'debug': `
	*{
	font-family:sans-serif;border:3px solid black;margin:25px;font-size:20px;
	}
	body,html,input,textarea,select{
		background:initial;
		color:black;
	}
	body, html {
		background-color: aliceblue;
		margin:25px;
	}
	iframe {
		height: 265px;
		border: 3px solid limegreen;
		margin: 25px;
		width: calc(100% - 56px);
	}
	div{
		border-color:slategray;
	}
	
	form{
		border-color:orange;
	}
	
	input,textarea,select{
		-moz-appearance: none;
		-webkit-appearance: none;
		appearance: none;
		background-color: #fafafa;
		border: 2px solid #cacece;
		box-shadow: 0 1px 2px rgba(0,0,0,0.05), inset 0px -15px 10px -12px rgba(0,0,0,0.05);
		padding: 9px;
		border-radius: 3px;
		display: inline-block;
		position: relative;
		border-color:salmon;
		margin: 25px;
	}
	
	select{
		background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' version='1.1' height='15px' width='10px'%3E%3Ctext x='-4' y='13' fill='gray'%3E%E2%96%BE%3C/text%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-size: 1EM 1EM;
		background-position: right center;
		padding-right: 25px;
	}
	
	input[type="password"]{
		border-color:crimson;
	}
	
	input[type=checkbox]:checked{
		border-color:crimson;
	}

	input[type=checkbox]:checked:after {
		content: '\\2714';
		font-size: 18px;
		overflow:visible;
		position: absolute;
		top: -3px;
		left: 2px;
		right: auto;
		padding: 5px;
		color: #555;
	}

	input[type=submit]{
		cursor:pointer;
	}
	#settings{
		position: absolute;
		right: auto;
		top: 0px;
		left: 0px;
		background-color:snow;
		padding: 5px;
	}
	#messagebox{
		width: 600px;
		height: 45px;
		float: left;
	}
	#settings_options {
		width: 700px;
		height: 600px;
	}
	.post-handle{
		color: #222
	}
	.self > .post-handle{
		color: salmon
	}
	*:focus{
		background-color:#eee;
	}
	</style>`,
	// DEBUG THEME </END>

	// DARK THEME <START>
	'dark': `
	#settings{
		position: absolute;
		top: 0px;
		right: 4px;
		background-color:#222;
		padding: 5px;
	}
	body,html{
		background:#333;
		color:#ddd;
		margin:0;
	}
	*{
		font-size:16;
		font-family:sans-serif;
	}
	*:focus {
		background-color: #3e3e3e;
	}
	a {
		color: cyan;
		text-decoration:underline;
	}
	a:visited {
		color: violet;
	}
	iframe{
		border:0;
		width: calc(100% - 56px);
		margin: 10px 25px -30px 25px;
		height: 75px;
	}
	input,textarea,select{
		color:#ddd;
		-moz-appearance: none;
		-webkit-appearance: none;
		appearance: none;
		background-color: #444;
		border: 2px solid #222;
		box-shadow: 0 1px 2px rgba(0,0,0,0.05), inset 0px -15px 10px -12px rgba(0,0,0,0.05);
		padding: 9px;
		border-radius: 3px;
		display: inline-block;
		position: relative;
		margin: 5px 0 10px 0;
	}
	
	select{
		background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' version='1.1' height='15px' width='11px'%3E%3Ctext x='-4' y='14' fill='lightgray'%3E%E2%96%BE%3C/text%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-size: 1EM 1EM;
		background-position: right center;
		padding-right: 25px;
	}

	input[type=checkbox]:checked:after {
		content: '\\2714';
		font-size: 18px;
		overflow:visible;
		position: absolute;
		top: -8px;
		left: -3px;
		right: auto;
		padding: 5px;
		color: salmon;
	}

	input[type=submit]{
		cursor:pointer;
	}
	
	#messagebox{
		width: 600px;
		height: 40px;
		margin-right: 5px;
		float: left;
	}
	.post-handle{
		color: #eee
	}
	.self > .post-handle{
		color: salmon
	}
	#checkshow + label {
		position: absolute;
		top: 0;
		right: 0px;
		padding: 6px;
		background-color: #222;
		width: 100px;
	}
	#checkshow:checked + label {
		background-color: #200;
	}
	#settings_options{
		width: 350px;
	}
	</style>`
	// DARK THEME </END>
}


const DEFAULT_THEME = 'dark'
const DEFAULT_MESSAGE_FIELD = 'input'
const ALTERNATE_MESSAGE_FIELD = 'textarea'
const INVALID_REQUEST_ERROR = `Invalid request.`
const INTERNAL_SYSTEM_HANDLE = `SYSTEM MESSAGE`

var whitespaceBits = '                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 '
var users = []
var msgs = []


//Functions for Dynamic HTML Generation

/**
 * Generate HTML for handle input field
 */
function GenHandleField(handle = null) {
	if (handle === null)
		return `<input autofocus tabindex="1" maxlength="12" name="handle" type="text" placeholder="Handle" title="Enter a screen name. Using this won\'t help to prove you are who you say you are, even if its true. (Max length: 15 characters)"></input>`
	else
		return `<input maxlength="12" name="handle" type="hidden" value="${handle}"></input>`
}
/**
 * Generate HTML for passcode input field
 */
function GenPasscodeField(passcode = null) {
	if (passcode === null)
		return `<input tabindex="2" maxlength="30" name="passcode" type="password" placeholder="Passcode" title="Enter a password. All passwords generate unique tripcodes, and the same password will generate the same tripcode over and over. If you use an easily guessable password, a user can log in as you and send messages while also using your name, making it look like you sent the messages yourself. (Max length: 30 characters, anything longer will be trimmed off.)"></input>`
	else
		return `<input maxlength="30" name="passcode" type="hidden" value=${passcode}></input>`
}
/**
 * Generate HTML for message input field
 */
function GenMessageField(inputMode = null) {
	if (inputMode != ALTERNATE_MESSAGE_FIELD) {
		inputMode = DEFAULT_MESSAGE_FIELD
	}
	return `<${inputMode} id="messagebox" tabindex="1" maxlength="200" name="msg" type="text" autofocus placeholder="Write message here..." title="Enter a message. (Max length: 200 characters, anything longer will be trimmed off.)"></${inputMode}>`
}
/**
 * Generate HTML for hidden key field
 */
function GenKeyField(key) {
	return `<input name="key" type="hidden" value=${key}></input>`
}
/**
 * Generate CSS styles using the name of the theme in CSS_THEMES[]
 */
function GenCSS(theme = null) {
	if (theme === null) {
		return BASE_CSS + CSS_THEMES[DEFAULT_THEME] // No theme
	} else {
		try {
			if (theme != undefined && theme != null && theme != "") {
				return BASE_CSS + CSS_THEMES[theme]
			} else if (theme == undefined || theme == null || theme == "") {
				return BASE_CSS + CSS_THEMES[DEFAULT_THEME]
			} else {
				throw `theme "${theme}" not found`
			}
		} catch (error) {
			console.error("Error attempting to load a theme that doesn't exist, details:\n" + error)
			return BASE_CSS + CSS_THEMES[DEFAULT_THEME]
		}
	}
}

function getAllThemesAsOptions(theme) {
	themesResult = ""
	for (var iTheme in CSS_THEMES) {
		if (iTheme == theme || ((theme == null || theme == "" || theme == undefined) && iTheme == DEFAULT_THEME)) {
			themesResult += `<option value="${iTheme}" selected>${iTheme}</option>`
		} else {
			themesResult += `<option value="${iTheme}">${iTheme}</option>`
		}
	}
	return themesResult
}

function getInputModesAsOptions(inputMode) {
	if (inputMode == "input" || (inputMode == null)) {
		return `<option value="i" selected>Single line, send with ENTER</option>
		<option value="t">Multi-line, send with TAB then ENTER</option>`
	} else {
		return `<option value="i">Single line, send with ENTER</option>
		<option value="t" selected>Multi-line, send with TAB then ENTER</option>`
	}
}

/**
 * Generate Settings box which the user can open and edit values of in an iframe
 */
function GenSettingsPanel(key = null, theme = null, inputMode = null) {
	if (inputMode == "textarea") {
		inputMode = "t"
	} else {
		inputMode = "i"
	}
	if (key === null) {
		key = ""
	}
	if (theme === null) {
		theme = ""
	}
	return `<div id="settings">

	<input id="checkshow" type="checkbox"></input>
	<label for="checkshow"></label>

	<iframe allowtransparency="true" id="settings_options" src="/settings?input=${inputMode}&theme=${theme}&key=${key}"></iframe>
	</div>`
}
// Functions for authentification and security
/**
 * Generate tripcode
 */
function getTripcode(password) {
	return new Promise(function (resolve, reject) {
		crypto.pbkdf2(password, SALT, CRYPTO_ITERATIONS, HASH_LENGTH, DIGEST, (error, hash) => {
			if (error) {
				reject(error)
			} else {
				resolve(hash.toString('base64'))
			}
		})
	})
}
/**
 * Fetch user by their key from users[]
 */
function getUserByKey(key) {
	return new Promise(function (resolve, reject) {
		users.forEach(user => {
			if (key == user.key) {
				resolve(user)
				return user
			}
		})
		reject(key)
	})
}

/**
 * Escape HTML from input fields
 */
function escapeHtml(text) {
	var map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	}
	return text.replace(/[&<>"']/g, function (m) {
		return map[m]
	})
}

http.createServer((req, res) => {
	try {
		let connectTime = new Date().getTime();
		req.setTimeout(0)
		req.url = decodeURIComponent(req.url) //Clean out URL encoding, ex: '%20' -> ' '
		if (req.url === "/favicon.ico" || req.url === "/robots.txt") {
			res.end()
			return
		} else if (req.url.substring(0, 6) === "/post?" && req.method == "GET") {
			// When the form iframe is first loaded, the parent window places the key in the URL after "&"
			try {
				res.writeHead(200, HTMLHEADERS)
				_key = req.url.substring(6, req.url.length)
				getUserByKey(_key).then((user) => {
					res.end(`
						<form action="/post" method="post">
							${GenKeyField(user.key)} ${GenMessageField(user.inputMode)} ${HTML_SEND_BUTTON}
						</form>
						${GenCSS(user.theme)}
					`)
				}).catch((badKey) => {
					console.error(`Invalid key used to load an iframe with fields; key "${badKey}" not associated with any user`)
				})
			} catch (error) {
				console.error(`An error occured trying to load key from URL and respond with form in iframe;\n${error}`)
			}
			return
		} else if (req.url.substring(0, 10) === "/settings?" && req.method == "GET") {
			try {
				res.writeHead(200, HTMLHEADERS)
				let _inputMode, _theme, _key = ""
				// the flag after &, /settings?iXX indicates input, &tXX indicates textarea
				if (req.url.substring("/settings?".length, "/settings?input=t".length) == "input=t") {
					_inputMode = `textarea`
				} else {
					_inputMode = `input`
				}
				// the theme=, everything after the inputMode flag until the & before the key
				if (req.url.substring("/settings?input=t&theme=".length, req.url.length).indexOf("&") > 0) {
					_theme = req.url.substring("/settings?input=t&theme=".length, "/settings?input=t&theme=".length + req.url.substring("/settings?input=t&theme=".length, req.url.length).indexOf("&"))
					// the key=, identifying the user, comes after the & and is at the end of the string
					_key = req.url.substring("/settings?input=t&theme=&key=".length + req.url.substring("/settings?input=t&theme=".length, req.url.length).indexOf("&"), req.url.length)
				} else {
					_theme = ""
					// the key=, identifying the user, comes after the & and is at the end of the string
					_key = ""
				}

				if (_key != "" && _key != null) {
					getUserByKey(_key).then((user) => {
						if (user.theme != _theme) {
							user.theme = _theme
							msgs.push({
								'handle': INTERNAL_SYSTEM_HANDLE,
								'tripcode': "",
								'msg': '<span class="post-msg">Theme updated.</span>' + CSS_RESET + GenCSS(user.theme),
								'pm': user.handle,
								'time': new Date().getTime(),
							})
						}
						user.inputMode = _inputMode
					}).catch((badKey) => {
						console.error(`Invalid key used to load an iframe with fields; key "${badKey}" not associated with any user`)
						res.end(INVALID_REQUEST_ERROR)
					})
				}

				res.end(`
				<form action="/settings" method="GET">
					<label>Input mode</label><br>
					<select name="input">
						${getInputModesAsOptions(_inputMode)}
					</select>
					<br>

					<label>Theme</label><br>
					<select name="theme">
						${getAllThemesAsOptions(_theme)}
					</select>
					<br>

					<input type="hidden" name="key" value="${_key}">
					
					<input type="submit" value="Load changes"></input>
				</form>
				${GenCSS(_theme)}
				<style>body,html{background-color:transparent}</style>`)
			} catch (error) {
				console.error(`An error occured trying to load settings form in iframe;\n${error}`)
			}
			return
		}

		switch (req.method) {
			case 'GET':
				switch (req.url) {
					case '/':
						res.writeHead(200, HTMLHEADERS)
						res.write(`<div id="chat">
						<div>Welcome to the chat.</div>
						<form action="/" method="POST">
							${GenHandleField()} ${GenPasscodeField()} ${HTML_JOIN_BUTTON}
						</form>
						${GenCSS(DEFAULT_THEME)}
						</div>`)
						res.end()
						break
					default:
						res.end(INVALID_REQUEST_ERROR)
						break
				}
				break

			case 'POST':
				switch (req.url) {
					case '/':
						var queryData = ""
						req.on('data', (data) => {
							queryData += data
							if (queryData.length > 1e6) {
								queryData = ""
								response.writeHead(413, {
									'Content-Type': 'text/plain'
								}).end()
								req.connection.destroy()
							}
						})

						req.on('end', () => {
							req.post = qs.parse(queryData)
							if (req.post['pm'] === undefined) {
								req.post['pm'] = null
							}
							getTripcode(req.post['passcode']).then((hash) => {
								key = crypto.randomBytes(KEY_LENGTH).toString('hex')
								console.log(hash, key)
								users.push({
									'handle': req.post['handle'],
									'key': key,
									'tripcode': hash,
									'theme': DEFAULT_THEME,
									'lastChecked': connectTime,
									'inputMode': DEFAULT_MESSAGE_FIELD,
								})
								msgs.push({
									'handle': req.post['handle'],
									'tripcode': hash,
									'msg': req.post['handle'] + ' has joined the chat.',
									'pm': null,
									'time': new Date().getTime(),
								})
								renderChat(key)
							})
						})

						function renderChat(key) {
							res.writeHead(200, HTMLHEADERS)
							res.write(whitespaceBits)
							getUserByKey(key).then((user) => {
								// Create an iframe and send in it's GET field the key of the user, so they can send messages and be identified
								res.write(`
									<iframe allowtransparency="true" src="/post?${encodeURIComponent(key)}"></iframe>
									${GenSettingsPanel(key, user.theme, user.inputMode)}
									${GenCSS(user.theme)}
								`)
							}).then(() => {
								// Keep checking for new messages and inserting divs as they come
								res.write('<div id="chat">')
								setInterval(function () {
									getUserByKey(key).then((user) => {
										msgs.forEach(msg => {
											if (msg['time'] > user.lastChecked) {
												if (user.tripcode == msg['tripcode']) {
													res.write(`<div class="msg self">` + '<span class="post-tripcode">' + escapeHtml('[' + msg['tripcode'] + ']') + '</span><span class="post-handle">' + escapeHtml('<' + msg['handle'] + '>') + '</span>: <span class="post-msg">' + escapeHtml(msg['msg']) + "</span></div>")
												} else if (msg['handle'] == INTERNAL_SYSTEM_HANDLE && msg['pm'] === user.handle) {
													res.write(`<div class="msg">` + msg['msg'] + `</div>`)
												} else if (msg['handle'] == INTERNAL_SYSTEM_HANDLE && msg['pm'] === null) {
													res.write(`<div class="msg">` + msg['msg'] + `</div>`)
												} else if (msg['handle'] != INTERNAL_SYSTEM_HANDLE) {
													res.write(`<div class="msg">` + '<span class="post-tripcode">' + escapeHtml('[' + msg['tripcode'] + ']') + '</span><span class="post-handle">' + escapeHtml('<' + msg['handle'] + '>') + '</span>: <span class="post-msg">' + escapeHtml(msg['msg']) + "</span></div>")
												}
											}
										})
										user.lastChecked = new Date().getTime();
									})
								}, 100)
							})
						}
						break /* End of "/" with method POST */
					case '/post':
						queryData = ""
						req.on('data', (data) => {
							queryData += data
							if (queryData.length > 1e6) {
								queryData = ""
								response.writeHead(413, {
									'Content-Type': 'text/plain'
								}).end()
								req.connection.destroy()
							}
							return
						})

						req.on('end', () => {
							try {
								req.post = qs.parse(queryData)
								if (req.post['pm'] === undefined) {
									req.post['pm'] = null
								}
								res.writeHead(200, HTMLHEADERS)
								res.write(whitespaceBits)
								getUserByKey(req.post['key']).then((user) => {
									// res.write("Message recieved: " + req.post['handle'] + "(" + hash + ") said '" + req.post['msg'] + "'")
									msgs.push({
										'handle': user.handle,
										'tripcode': user.tripcode,
										'msg': req.post['msg'],
										'pm': req.post['pm'],
										'time': new Date().getTime(),
									})
									console.log(msgs[msgs.length - 1]);

									setInterval(function () {
										msgs.forEach(msg => {
											if (msg['time'] > user.lastChecked - 1000) {
												if (msg['handle'] == INTERNAL_SYSTEM_HANDLE && msg['pm'] === user.handle) {
													res.write(`<div style="display:none;position:absolute;">${msg['msg']}</div>`)
												}
											}
										})
									}, 300)

									// res.end(`<meta http-equiv="refresh" content="0;url=/post" />`)
									res.write(`
									<form action="/post" method="post">
										${GenKeyField(req.post['key'])} ${GenMessageField(user.inputMode)} ${HTML_SEND_BUTTON}
									</form>
									${GenCSS(user.theme)}
								`)
								}).catch((badKey) => {
									console.error(`Invalid key used to load an iframe with fields; key "${badKey}" not associated with any user`)
									res.end(INVALID_REQUEST_ERROR)
								})
							} catch (error) {
								console.error(`An error occured trying to load key from POST and respond with form in iframe;\n${error}`)
								res.end(INVALID_REQUEST_ERROR)
							}
						})
						break /* End of "/post" w/ method POST */
				}
				break
			default:
				res.writeHead(405, {
					'Content-Type': 'text/plain'
				})
				res.end()
				break
		}
	} catch (e) {
		console.log(e)
		process.exit()
	}
}).listen(PORT)

console.log(`I'm listening! Visit:\nhttp://localhost:` + PORT)
