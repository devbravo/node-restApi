const jwt = require('jsonwebtoken');
const { errorHandler } = require('../error/errorHandling');

module.exports = (req, res, next) => {
  let msg;
  const authHeader = req.get('Authorization');

  msg = 'Not authenticated';
  errorHandler(authHeader, msg, 401);

  const token = authHeader.split(' ')[1];
  let decodedToken;

  try {
    decodedToken = jwt.verify(token, 'somesupersecretsecret');
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  msg = 'Not authenticated';
  errorHandler(decodedToken, msg, 401);

  req.userId = decodedToken.userId;
  next();
};
