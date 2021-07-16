const createError = require('http-errors')
const express = require('express');
import { Request, Response } from 'express';
const path = require('path');
const Config = require('./utils/configSetup')

// Host address
const host = Config.HOST_ADDRESS || '127.0.0.1'
// If using HTTPS/HTTP, use specified port or default to common port
const port = (Config.USE_HTTPS ? Config.HTTPS_PORT || 443 : Config.HTTP_PORT || 80)

const bodyParser = require('body-parser')
const chatRouter = require('./routes/chat')

let app = express()

// view engine setup
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")

Config.loadConfig()
	.then(() => {
		app.locals.config = Config
	})
	.catch((error: Error) => {
		console.error(error)
		process.exit(1)
	})

app.use('/favicon.ico', express.static(path.join(__dirname, 'public', 'images', 'favicon.ico')));
app.use('/robots.txt', express.static(path.join(__dirname, 'public', 'robots.txt')));
// JSON engine ExpressJS
// app.use(express.json())
app.use(express.urlencoded({ extended: false }))


app.use(express.static(path.join(__dirname, 'public')))
app.use('/', chatRouter)
// TODO Blacklist things like robots.txt from /room names
const BLACKLISTED_ROOM_NAMES = [
	'robots.txt',
	'favicon.ico',
	'public'
]

// Catch 404s and pass to error handler
app.use((req: Request, res: Response, next: Function) => {
	next(createError(404))
})

// Error handler
app.use((err: any, req: Request, res: Response, next: Function) => {
	// Set locals, only providing error in development
	res.locals.message = err.message
	res.locals.error = req.app.get('env') === 'development' ? err.status : {}

	// Render the error page
	res.status(err.status || 500)
	res.render('layout', { page: 'error', url: '' })
})

// TODO Should listen on http port and redirect to https port? perhaps an option
app.listen(port, host, (err: any) => {
	if (err) {
		console.error(err)
		process.exit(1)
	}
	console.log(`Server listening at ${(Config.USE_HTTPS ? "https://" : "http://")}${host}:${port}`)
})
module.exports = app
