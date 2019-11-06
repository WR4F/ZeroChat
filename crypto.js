const CRYPTO_ITERATIONS = 10000
const SALT = "dummy" // !!! Replace with a real salt
const DIGEST = "sha256"
const HASH_LENGTH = 6
const KEY_LENGTH = 30

const crypto = require("crypto")

var cryptoUtils = {}

/**
 * Generate tripcode
 */
cryptoUtils.genTripcode = (password) => {
	return new Promise(function (resolve, reject) {
		crypto.pbkdf2(
			password,
			SALT,
			CRYPTO_ITERATIONS,
			HASH_LENGTH,
			DIGEST,
			(error, hash) => {
				if (error) {
					reject(error)
				} else {
					resolve(hash.toString("base64"))
				}
			},
		)
	})
}

cryptoUtils.dispenseToken = () => {
	return crypto.randomBytes(KEY_LENGTH).toString("hex")
}

module.exports = cryptoUtils
