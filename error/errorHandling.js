// Error helpers
exports.serverError = err => {
  if (!err.statusCode) {
    err.statusCode = 500;
  }
};

exports.errorHandler = (data, msg, statusCode) => {
  if (!data) {
    const error = new Error(msg);
    error.statusCode = statusCode;
    throw error;
  }
};

// exports.validationError = errors => {
//   if (!errors.isEmpty()) {
//     const error = new Error('Validation failed, entered data is incorrect.');
//     error.statusCode = 422;
//     throw error; // in sync code snippet throw error will work
//   }
// };

// exports.postNotFoundError = post => {
//   if (!post) {
//     const error = new Error('Could not find post.');
//     error.statusCode = 404;
//     throw error;
//   }
// };

// exports.noImagePickedError = (data, msg) => {
//   if (!data) {
//     const error = new Error(msg);
//     error.statusCode = 422;
//     throw error;
//   }
// };
