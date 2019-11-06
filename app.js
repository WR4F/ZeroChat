const createError = require("http-errors")
const express = require("express")
const path = require("path")
const bodyParser = require("body-parser")

const chatRouter = require("./routes/chat")

var app = express()

// view engine setup
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, "public")))

app.use(bodyParser.json()) // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })) // support encoded bodies

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

	// render the error page
	res.status(err.status || 500)
	res.render("layout", { page: "error" })
})

module.exports = app
