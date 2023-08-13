const { logger, accesslog } = require("./logger.js");

class RequestError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    switch (statusCode) {
      case 400:
        this.status = "Bad Request";
        break;
      case 403:
        this.status = "Forbidden";
        break;
      case 404:
        this.status = "Not Found";
        break;
      case 500:
        this.status = "Internal Server Error";
        break;
    }
  }
}

const error = (req, res, next) => {
  res.error = (err) => {
    if (err.statusCode) {
      res.status(err.statusCode).json({ 
        status: err.status,
        message: err.message 
      });
    } else if (!res.statusCode) {
      res.status(500).json({ 
        status: "Internal Server Error"
      });
    }
    accesslog(req, res);
    return ;
  };
  next();
};

const errorHandler = (err, req, res, next) => {
  if (err.statusCode) {
    logger.warn(err);
  } else {
    logger.error(err);
  }
  res.status(err.statusCode || 500).error(err);
};

module.exports = {
  RequestError: RequestError,
  error: error,
  errorHandler: errorHandler,
};