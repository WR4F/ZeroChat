const crypto = require("../crypto")

DEFAULT_THEME = "dark"
// TODO: User input data needs sanitizing
/**
 * User objects hold user info for use in chat
 */
module.exports = class User {
	constructor(handle, pass, res) {
		this.handle = handle // screen name
		this.token = crypto.dispenseToken() // session token
		this.tripcode = crypto.genTripcode(pass) // identifying tripcode
		this.theme = DEFAULT_THEME // preferred theme
		this.res = { "chatroom": res, "post": null, "messages": null } // response object
	}
}
