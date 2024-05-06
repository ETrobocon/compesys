const bodyParser = require("body-parser");
const fs = require("fs");
const express = require("express");
const router = express.Router();
const limiter = require('express-limiter')
const { RequestError, error }= require('../custom_error.js');
const { STATE } = require("../constants");
const { logger } = require("../logger.js");
const loggerChild = logger.child({ domain: "snap" });

const AsyncLock = require('async-lock');
const lock = new AsyncLock({timeout:5000});

router.use(error);

router.post(
  "/",
  limiter({ 
    lookup: ['connection.remoteAddress'],
    total: 10,
    expire: 1000,
    onRateLimited: (req, res, next) => {
      next({ message: 'Rate limit exceeded', status: 429 })
    }
  }), 
  bodyParser.raw({ type: ["image/jpeg"], limit: ["10mb"] }),
  (req, res) => {
  lock.acquire('snap-lock', () => {
    if (
      req.app.get("state") === STATE.READY ||
      req.app.get("state") === STATE.GOAL
    ) {
      throw new RequestError(403, "Request not currently allowed");
    }
    const id = req.query.id;
    if (id === undefined || !(id >= 1 && id <= 300)) {
      throw new RequestError(400, "Invalid id format or range");
    }
    if (req.get("Content-Type") !== "image/jpeg") {
      throw new RequestError(400, "Unexpected content type");
    }
    const now = new Date();
    const date =
      now.getFullYear() +
      ("0" + (now.getMonth() + 1)).slice(-2) +
      ("0" + now.getDate()).slice(-2) +
      ("0" + now.getHours()).slice(-2) +
      ("0" + now.getMinutes()).slice(-2) +
      ("0" + now.getSeconds()).slice(-2) +
      ("0" + now.getMilliseconds()).slice(-3);
    const directoryPath = `${process.env.TEMP_DIR}/${id}`;
    const path = `${process.env.TEMP_DIR}/${id}/${id}_${date}.png`;

    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, (err) => {
        if (err) {
          throw err;
        }
        fs.chmodSync(directoryPath, 0o777, (err) => {
          if (err) {
            throw err;
          }
        });
      });
    }

    const files = fs.readdirSync(directoryPath);
    const fileCount = files.length;
    if (fileCount > 2 && req.app.get("state") !== STATE.UNDEFINDED) {
      throw new RequestError(429, "Up to 2 images can be accepted");
    }
    fs.writeFileSync(path, req.body, "binary", (err) => {
      if (err) {
        throw err;
      }
      fs.chmodSync(path, 0o777, (err) => {
        if (err) {
          throw err;
        }
      });
    });
    res.status(201).json({ status: "Created" });
  })
  .then (() =>{
  })
  .catch ((error) =>{
    res.status(error.statusCode).error(error);
  })

  
});

router.all("*", (req, res, next) => {
  next('router')
});

module.exports = router;