const pino = require("pino");
const logger = pino({
  level: "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: {
    targets: [
      {
        target: "pino-pretty",
        options: {},
      },
      {
        target: "pino/file",
        options: {
          destination: "/var/log/compesys/server.log",
          mkdir: true,
        },
      },
    ],
  },
});

function accesslogHandler(req, res, next) {
  var oldWrite = res.write;
  var oldEnd = res.end;

  var chunks = [];
  res.write = function (chunk) {
    chunks.push(chunk);
    oldWrite.apply(res, arguments);
  };

  res.end = function (chunk) {
    if (chunk) {
      chunks.push(chunk);
    }

    let logs = req.ip + " " + req.method + " " + req.originalUrl + " " + res.statusCode;
    if (res.get('Content-Type').startsWith('application/json')) {
      let body = Buffer.concat(chunks).toString('utf8');
      logs += " " + body;
    }

    if (res.statusCode >= 200 && res.statusCode < 300) {
      logger.info(logs);
    } else if (res.statusCode >= 400 && res.statusCode < 500) {
      logger.warn(logs);
    } else {
      logger.error(logs);
    }
    oldEnd.apply(res, arguments);
  };

  next();
}

module.exports = {
  logger: logger,
  accesslogHandler: accesslogHandler,
};
