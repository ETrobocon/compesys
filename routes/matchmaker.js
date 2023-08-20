const archiver = require("archiver");
const fs = require("fs");
const express = require("express");
const router = express.Router();
const { RequestError, error }= require('../custom_error.js');
const { STATE, MATCHMAKER_IP } = require("../constants");
const { logger } = require("../logger.js");
const loggerChild = logger.child({ domain: "matchmaker" });

router.use(error);
router.use((req, res, next) => {
  if (req.ip !== MATCHMAKER_IP) {
    const error = new RequestError(403, "Request not currently allowed");
    return res.status(error.statusCode).error(error);
  }
  next();
});

router.put("/state/:trigger", (req, res) => {
  try {
    const trigger = req.params.trigger;
    switch (trigger) {
      case  "ready":
        req.app.set("state", STATE.READY);
        req.app.set("allowOpReqToTrain", false);
        if (fs.existsSync(process.env.TEMP_DIR)) {
          execSync(`rm -rf ${process.env.TEMP_DIR}/*`);
        }
        break;
      case "running":
        req.app.set("state", STATE.RUNNING);
        setTimeout(() => {
          if (req.app.get("state") === STATE.RUNNING) {
            req.app.set("allowOpReqToTrain", true);
          }
        }, 10000);
        break;
      case "passing":
        req.app.set("state", STATE.PASSING);
        req.app.set("allowOpReqToTrain", true);
        break;
      case "goal":
        req.app.set("state", STATE.GOAL);
        req.app.set("allowOpReqToTrain", false);
        break;
    }
    res.json({
      status: "OK",
    });
  } catch (error) {
    return res.status(error.statusCode).error(error);
  }
});

router.get("/image/:id", async(req, res) => {
  try {
    const id = req.params.id;

    const zipPath = `${process.env.TEMP_DIR}/${id}.zip`;
    const targetDirectory = `${process.env.TEMP_DIR}/${id}`;

    const archive = archiver.create("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });
    const output = fs.createWriteStream(zipPath);
    archive.pipe(output);

    archive.directory(targetDirectory, false);

    archive.finalize();
    await output.on("close", () => {
      res.header("Content-Type", "application/zip;");
      res.header("Content-Disposition", "attachment;");
      res.status(200).sendFile(zipPath);
    });
  } catch (error) {
    return res.status(error.statusCode).error(error);
  }
});

router.all("*", (_, _, next) => {
  next('router')
});

module.exports = router;
