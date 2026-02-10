/**
 * Enhanced error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Log error for debugging
  const errorLog = {
    message: err.message,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown',
  };

  // Only log stack in development
  if (process.env.NODE_ENV !== 'production') {
    errorLog.stack = err.stack;
    console.error('Error:', errorLog);
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry. This record already exists.';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large. Maximum size is 10MB.';
    } else {
      message = err.message;
    }
  }

  // Sanitize error messages in production
  const sanitizedMessage = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An error occurred. Please try again later.'
    : message;

  res.status(statusCode).json({
    success: false,
    message: sanitizedMessage,
    requestId: req.id || undefined,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.message !== sanitizedMessage ? err.message : undefined
    }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};


