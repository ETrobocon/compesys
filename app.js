require("dotenv").config();
const fs = require("fs");
const { execSync } = require("child_process");
const express = require("express");

const app = express();
const { logger, accesslogHandler } = require("./logger.js");
const loggerChild = logger.child({ domain: "app" });
const { STATE } = require("./constants");

loggerChild.info("etrobo competition system");
loggerChild.info(`Version:${process.env.npm_package_version}`);
loggerChild.info("Initialization: start");

//const hello = require("./routes/hello");
const snap = require("./routes/snap");
//const matchmaker = require("./routes/matchmaker");
const version = require("./routes/version.js");
const lists = require("./routes/list.js");

app.use(accesslogHandler);
//app.use("/$", hello);
app.use("/snap", snap);
//app.use("/matchmaker", matchmaker);
app.use("/version", version);
app.use("/list", lists);

app.use((req, res) => {
  res.status(404).json({
    status: "Not Found",
  });
});
app.set("state", STATE.UNDEFINDED);
app.set("allowOpReqToTrain", true);

if (fs.existsSync(process.env.TEMP_DIR)) {
  execSync(`rm -rf ${process.env.TEMP_DIR}/*`);
} else {
  fs.mkdirSync(process.env.TEMP_DIR, { mode: 0o777 }, (err) => {
    if (err) {
      throw err;
    }
    fs.chmodSync(process.env.TEMP_DIR, 0o777, (err) => {
      if (err) {
        throw err;
      }
    });
  });
}

loggerChild.info("Initialization: completion");

const server = app.listen(process.env.LISTEN_PORT, '0.0.0.0', () => {
  loggerChild.info("server listening on PORT:" + server.address().port);
});
