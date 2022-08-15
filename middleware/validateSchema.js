const { validationResult } = require("express-validator");

const validateSchema = (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  } catch (e) {
    return res.status(400).send(e.errors);
  }
}

module.exports = {
  validateSchema
}