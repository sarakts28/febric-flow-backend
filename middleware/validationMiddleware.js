const validationErrorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError' || err.name === 'ValidatorError' || err.code === 11000) {
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => ({
        field: error.path,
        message: error.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors
      });
    }
    
    // Handle duplicate key errors (unique constraint)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate field value: ${field}. Please use another value.`,
        field: field
      });
    }
    
    // Handle other validation errors
    return res.status(400).json({
      success: false,
      message: err.message || 'Validation Error'
    });
  }
  
  // If it's not a validation error, pass it to the next error handler
  next(err);
};

export default validationErrorHandler;
