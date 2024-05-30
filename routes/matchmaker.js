const archiver = require("archiver");
const fs = require("fs");
const { execSync } = require("child_process");
const express = require("express");
const router = express.Router();
const { RequestError, error }= require('../custom_error.js');
const { STATE, MATCHMAKER_IP } = require("../constants");
const { logger } = require("../logger.js");
const loggerChild = logger.child({ domain: "matchmaker" });
const { exec } = require('child_process');      // システムコマンドを実行するためのchild_processモジュールを使用

function isValidSyncTime(synctime) {
  // YYYYMMDDhhmmssのフォーマットに一致する正規表現パターン
  const pattern = /^(19|20)\d\d(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])([01][0-9]|2[0-3])([0-5][0-9])([0-5][0-9])$/;
  return pattern.test(synctime);
}

//// 使用例
// const synctime = "20240530184341";
// console.log(isValidSyncTime(synctime)); // 出力: true or false

// execをPromiseでラップする関数
function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (execerr, stdout, stderr) => {
      if (execerr) {
        reject(execerr);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}
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
      case "undefinded":
        req.app.set("state", STATE.UNDEFINDED);
        break;
      case "ready":
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

router.put("/clock/:synctime", async(req, res) => {
  try {
    const synctime = req.params.synctime;
    if (isValidSyncTime(synctime)) {
      const formattedTime = `${synctime.substring(0, 4)}-${synctime.substring(4, 6)}-${synctime.substring(6, 8)} ${synctime.substring(8, 10)}:${synctime.substring(10, 12)}:${synctime.substring(12, 14)}`;
      // execPromiseをawaitで呼び出し
      const { stdout } = await execPromise(`sudo date --set="${formattedTime}"`);
      res.status(200).send(`時刻を設定しました: ${formattedTime}\n${stdout}`);
    } else {
      res.status(400).send('無効なフォーマットです。');
    }
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

router.all("*", (req, res, next) => {
  next('router')
});

module.exports = router;
