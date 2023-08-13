const pino = require("pino");
const logger = pino({
  level: "info",
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

const accesslog = (req, res) => {
  logger.info(
    req.method + " " + req.originalUrl + " code: " + res.statusCode + " "
  );
};

module.exports = {
  logger: logger,
  accesslog: accesslog,
};
