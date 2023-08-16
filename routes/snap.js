const bodyParser = require("body-parser");
const fs = require("fs");
const express = require("express");
const router = express.Router();
const { RequestError, error }= require('../custom_error.js');
const { STATE } = require("../constants");
const { logger } = require("../logger.js");
const loggerChild = logger.child({ domain: "snap" });

router.use(error);

router.post(
  "/",
  bodyParser.raw({ type: ["image/png"], limit: ["10mb"] }),
  (req, res) => {
    try {
      if (
        req.app.get("state") === STATE.READY ||
        req.app.get("state") === STATE.GOAL
      ) {
        throw new RequestError(403, "Request not currently allowed");
      }
      const id = req.query.id;
      if (id === "") {
        throw new RequestError(400, "Bad Request");
      }
      if (req.get("Content-Type") !== "image/png") {
        throw new RequestError(400, "Unexpected content type");
      }
      const now = new Date();
      const date =
        now.getFullYear() +
        ("0" + (now.getMonth() + 1)).slice(-2) +
        ("0" + now.getDate()).slice(-2) +
        ("0" + now.getHours()).slice(-2) +
        ("0" + now.getMinutes()).slice(-2) +
        ("0" + now.getSeconds()).slice(-2);
      const directoryPath = `${process.env.TEMP_DIR}/${id}`;
      const path = `${process.env.TEMP_DIR}/${id}/${id}_${date}.png`;
      if (!fs.existsSync(directoryPath)) {
        fs.mkdir(directoryPath, (err) => {
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
      fs.writeFile(path, req.body, "binary", (err) => {
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
    } catch (error) {
      return res.status(error.statusCode).error(error);
    } 
  }
);

router.all("*", (req, res, next) => {
  next('router')
});

module.exports = router;
