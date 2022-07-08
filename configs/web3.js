require('dotenv').config()

module.exports = {
    defaultAccountAddress: process.env.DEFAULT_ACCOUNT_ADDRESS,
    ethHttpProvider: process.env.ETH_HTTP_PROVIDER,
    ethPrivateKey: process.env.ETH_PRIVATE_KEY,
    ethConfirmations: 10
}