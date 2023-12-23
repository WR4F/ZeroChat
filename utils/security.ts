const cryptography = require("crypto")
const Config = require('./configSetup')

let chatCrypto = {
	CRYPTO_ITERATIONS: 10000,
	SALT: Config.SECRET_SALT,

	HASH_LENGTH: 6,
	DIGEST: "sha256",

	KEY_LENGTH: 30,
	TRIPCODE_LENGTH: 6,
	EXPECTED_TOKEN_LENGTH: 60,
	// Generate unique hash (tripcode) from password
	genTripcode: (password: String) => {
		return new Promise(function (resolve, reject) {
			if (password == null || password == "") {
				return resolve("Anon")
			}
			cryptography.pbkdf2(
				password,
				chatCrypto.SALT,
				chatCrypto.CRYPTO_ITERATIONS,
				chatCrypto.HASH_LENGTH,
				chatCrypto.DIGEST,
				(error: Error, hash: String) => {
					if (error) {
						reject(error)
					} else {
						resolve(Buffer.from(hash, 'binary').toString("base64").substring(0, chatCrypto.TRIPCODE_LENGTH))
					}
				},
			)
		})
	},
	dispenseToken: () => {
		return cryptography.randomBytes(chatCrypto.KEY_LENGTH).toString("hex")
	}
}

module.exports = chatCrypto
