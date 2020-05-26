const createError = require("http-errors")
const express = require("express")
const path = require("path")
const bodyParser = require("body-parser")

const config = require("./classes/Config")
const chatRouter = require("./routes/chat")

let app = express()

// view engine setup
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")

config.loadConfig()
	.then(() => {
		app.locals.config = config
	})
	.catch((error) => {
		console.error(error)
		exit(1)
	})

// NOTE might have to blacklist things like robots.txt and this from /room names
app.use('/favicon.ico', express.static(path.join(__dirname, 'public', 'images', 'favicon.ico')));

// FIXME are these both needed?
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.json()) // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })) // support x-www-form-urlencoded bodies


app.use(express.static(path.join(__dirname, "public"))) // NOTE might have to switch to _ prefix to support /rooms
app.use("/", chatRouter)

// catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404))
})

// error handler
app.use((err, req, res, next) => {
	// set locals, only providing error in development
	res.locals.message = err.message
	res.locals.error = req.app.get("env") === "development" ? err.status : {}

	if (req.body && req.body.token) {
		return chatRouter.errorWithPostToken(err, req, res)
	}

	// render the error page
	res.status(err.status || 500)
	res.render("layout", { page: "error", url: "" })
})

console.log("Express app done setting up");
module.exports = app
