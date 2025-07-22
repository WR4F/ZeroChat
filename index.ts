const createError = require('http-errors')
const express = require('express');
import { Request, Response } from 'express';
const path = require('path');
const Config = require('./utils/configSetup')
const http = require('http');
const https = require('https');
const fs = require('fs');

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

app.use(express.urlencoded({ extended: false }))

app.use(express.static(path.join(__dirname, 'public')))
app.use('/', chatRouter)

// Catch 404s and pass to error handler
app.use((req: Request, res: Response, next: Function) => {
	next(createError(404))
})

// Error handler
app.use((err: any, req: Request, res: Response, next: Function) => {
	// Set locals, only providing error in development
	res.locals.message = err.message
	res.locals.error = {}

	// Render the error page
	res.status(err.status || 500)
	res.render('layout', { page: 'error', url: '' })
})

// Host address
const host = Config.ADDRESS

if (Config.USE_HTTPS === 'true') { // Using HTTPS
	if (!Config.HTTPS_PRIV_KEY) { throw new Error("Using HTTPS, but missing HTTPS_PRIV_KEY path") }
	if (!Config.HTTPS_CERT) { throw new Error("Using HTTPS, but missing HTTPS_CERT path") }
	const credentials = {
		key: fs.readFileSync(Config.HTTPS_PRIV_KEY, 'utf8'),
		cert: fs.readFileSync(Config.HTTPS_CERT, 'utf8')
	};
	const httpsServer = https.createServer(credentials, app);
	httpsServer.listen(Config.HTTPS_PORT, (err: any) => {
		if (err) {
			console.error(err)
			process.exit(1)
		}
		if (host == "0.0.0.0") {
			console.log(`Server listening at https://localhost:${Config.HTTPS_PORT}`)
		} else {
			console.log(`Server listening at https://${host}:${Config.HTTPS_PORT}`)
		}
	})

	// Redirect HTTP to HTTPS
	const httpRedirect = express();
	httpRedirect.all('*', (req: Request, res: Response) => {
		res.redirect(`https://${req.hostname}:${Config.HTTPS_PORT}${req.url}`)
	});
	const httpServer = http.createServer(httpRedirect);
	httpServer.listen(Config.HTTP_PORT, () => console.log(`HTTP server listening and redirecting on port ${Config.HTTP_PORT}`));
} else { // Using HTTP
	const httpServer = http.createServer(app);
	httpServer.listen(Config.HTTP_PORT, (err: any) => {
		if (err) {
			console.error(err)
			process.exit(1)
		}
		if (host == "0.0.0.0") {
			console.log(`Server listening at http://localhost:${Config.HTTP_PORT}`)
		} else {
			console.log(`Server listening at http://${host}:${Config.HTTP_PORT}`)
		}
	})
}
module.exports = app
