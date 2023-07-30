const pino = require("pino");

module.exports.logger = pino({
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
