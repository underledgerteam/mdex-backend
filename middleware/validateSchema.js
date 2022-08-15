const { validationResult } = require("express-validator");

const validateSchema = (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      let errorMessage = errors.array()[0]["msg"];
      return res.error("COM001", errorMessage, 400)
    }
    next();
  } catch (e) {
    return res.error("COM002", e.errors, 400);
  }
}

module.exports = {
  validateSchema
}