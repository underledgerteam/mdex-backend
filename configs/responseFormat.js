const exceptionCode = require("../utils/exceptionCode");

module.exports = (req, res, next) => {
  res.success = (data = null, statusCode = 200) => {
    res.status(statusCode || 200).send({
      success: true,
      data: data
    })
  }

  res.error = (code = null, message = null, statusCode = 500) => {
    if (code in exceptionCode && !message) {
      message = exceptionCode[code];
    }

    res.status(statusCode || 500).send({
      success: false,
      code: code,
      message: message
    })
  }

  next()
}