const express = require("express");
const router = express.Router();
const { RequestError, error, errorHandler }= require('../custom_error.js');
const iottrain = require("../iottrain_central");
const { logger, accesslog } = require("../logger.js");
const loggerChild = logger.child({ domain: "train" });

router.get("/", async (req, res) => {
  try {
    if (
      req.app.get("state") === STATE.READY ||
      req.app.get("state") === STATE.GOAL
    ) {
      res.status(403).json({
        status: "Forbidden",
        message: "Request not currently allowed",
      });
      return;
    }

    const accel = iottrain.inbox.accelerometer;
    const gyro = iottrain.inbox.gyroscope;
    const volt = iottrain.inbox.voltage;

    const param = {
      accel: {
        x: accel.x,
        y: accel.y,
        z: accel.z,
      },
      gyro: {
        x: gyro.x,
        y: gyro.y,
        z: gyro.z,
      },
      volt: volt.value,
    };
    loggerChild.info(param);
    res.json(param);
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

router.put("/", async (req, res) => {
  try {
    if (!req.app.get("allowOpReqToTrain")) {
      res.status(403).json({
        status: "Forbidden",
        message: "Request not currently allowed",
      });
      return;
    }
    const pwm = Number(req.query.pwm);
    if (pwm === NaN || !(pwm >= 0 && pwm <= 100)) {
      res.status(400).json({
        status: "Bad Request",
        message: "pwm not specified or out of range",
      });
      return;
    }

    const err = await setPWM(pwm);

    if (err == null) {
      res.json({
        status: "OK",
      });
    } else {
      loggerChild.error(err);
      res.status(500).json({
        status: "Internal Server Error",
      });
    }
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
const setPWM = (pwm) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject('timeout'), 1000);
    iottrain.characteristics["pwm"].instance.write(
      new Buffer.from([pwm]),
      false,
      (error) => {
        if (error !== null) {
          return reject(error);
        }
        return resolve();
      }
    );
  })
    .then(() => {
      return;
    })
    .catch((error) => {
      loggerChild.error(error);
      iottrain.inbox["voltage"].value = null;
      return error;
    });
};

module.exports = router;
