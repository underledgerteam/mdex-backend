require('dotenv').config()

module.exports = {
    defaultAccountAddress: process.env.DEFAULT_ACCOUNT_ADDRESS,
    rinkebyHttpProvider: process.env.RINKEBY_HTTP_PROVIDER,
    privateKey: process.env.PRIVATE_KEY,
    ethConfirmations: 10
}