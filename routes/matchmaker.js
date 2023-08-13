const archiver = require("archiver");
const fs = require("fs");
const express = require("express");
const router = express.Router();
const { RequestError, error, errorHandler }= require('../custom_error.js');
const { logger, accesslog } = require("../logger.js");
const loggerChild = logger.child({ domain: "matchmaker" });

router.put("/state/:trigger", (req, res) => {
  try {
    const trigger = req.params.trigger;
    switch (trigger) {
      case  "ready":
        req.app.set("state", STATE.READY);
        req.app.set("allowOpReqToTrain", false);
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
    loggerChild.error(error);
    res.status(500).json({
      status: "Internal Server Error",
    });
  } finally {
    loggerChild.info(
      req.method + " " + req.originalUrl + " code: " + res.statusCode
    );
  }
});

router.get("/image/:id", (req, res) => {
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
    output.on("close", () => {
      res.header("Content-Type", "application/zip;");
      res.header("Content-Disposition", "attachment;");
      res.status(200).sendFile(zipPath);
    });
  } catch (error) {
    loggerChild.error(error);
    res.status(500).json({
      status: "Internal Server Error",
    });
  } finally {
    loggerChild.info(
      req.method + " " + req.originalUrl + " code: " + res.statusCode
    );
  }
});
router.use(accesslog);

module.exports = router;
