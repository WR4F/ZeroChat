
const crypto = require("crypto")
const Config = require("./classes/Config")

let chatCrypto = {
	CRYPTO_ITERATIONS: 10000,
	SALT: Config.SECRET_SALT,
	HASH_LENGTH: 6,
	DIGEST: "sha256",
	KEY_LENGTH: 30,
	TRIPCODE_LENGTH: 6,
	EXPECTED_TOKEN_LENGTH: 60
}

/**
 * Generate tripcode
 */
chatCrypto.genTripcode = (password) => {
	return new Promise(function (resolve, reject) {
		crypto.pbkdf2(
			password,
			chatCrypto.SALT,
			chatCrypto.CRYPTO_ITERATIONS,
			chatCrypto.HASH_LENGTH,
			chatCrypto.DIGEST,
			(error, hash) => {
				if (error) {
					reject(error)
				} else {
					resolve(hash.toString("base64").substr(0, chatCrypto.TRIPCODE_LENGTH))
				}
			},
		)
	})
}

chatCrypto.dispenseToken = () => {
	return crypto.randomBytes(chatCrypto.KEY_LENGTH).toString("hex")
}

module.exports = chatCrypto
