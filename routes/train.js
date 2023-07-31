const express = require("express");
const router = express.Router();
const { STATE } = require("../constants");
const iottrain = require("../iottrain_central");
const { logger } = require("../logger.js");
const loggerChild = logger.child({ domain: "train" });

router.get("/", async (req, res, next) => {
  try {
    if (
      req.app.get("state") === STATE.READY ||
      req.app.get("state") === STATE.GOAL
    ) {
      res.header("Content-Type", "application/json; charset=utf-8");
      res.status(403).json({
        status: "Forbidden",
        message: "Request not currently allowed",
      });
      return;
    }

    const accel = iottrain.inbox.accelerometer;
    const gyro = iottrain.inbox.gyroscope;
    const volt = iottrain.inbox.voltage;

    console.log(
        "accel@" + accel.timestamp + ": " + accel.x + ", " + accel.y + ", " + accel.z
    );
    console.log(
      " gyro@" + gyro.timestamp + ": " + gyro.x + ", " + gyro.y + ", " + gyro.z
    );
    console.log(" volt@" + volt.timestamp + ": " + volt.value + "V");

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
    res.header("Content-Type", "application/json; charset=utf-8");
    res.send(param);
    return;
  } catch (error) {
    loggerChild.error(error);
    res.header("Content-Type", "application/json; charset=utf-8");
    res.status(500).json({
      status: "Internal Server Error",
    });
    return;
  } finally {
    loggerChild.info(
      req.method + " " + req.originalUrl + " code: " + res.statusCode
    );
    return;
  }
});

router.put("/", async (req, res, next) => {
  try {
    if (!req.app.get("allowOpReqToTrain")) {
      res.header("Content-Type", "application/json; charset=utf-8");
      res.status(403).json({
        status: "Forbidden",
        message: "Request not currently allowed",
      });
      return;
    }
    const pwm = Number(req.query.pwm);
    if (pwm === NaN || !(pwm >= 0 && pwm <= 100)) {
      res.header("Content-Type", "application/json; charset=utf-8");
      res.status(400).json({
        status: "Bad Request",
        message: "pwm not specified or out of range",
      });
      return;
    }

    const err = await setPWM(pwm);

    if (err == null) {
      res.header("Content-Type", "application/json; charset=utf-8");
      res.status(200).json({
        status: "OK",
      });
    } else {
      loggerChild.error(err);
      res.header("Content-Type", "application/json; charset=utf-8");
      res.status(500).json({
        status: "Internal Server Error",
      });
    }
    return;
  } catch (error) {
    loggerChild.error(error);
    res.header("Content-Type", "application/json; charset=utf-8");
    res.status(500).json({
      status: "Internal Server Error",
    });
    return;
  } finally {
    loggerChild.info(
      req.method + " " + req.originalUrl + " code: " + res.statusCode
    );
    return;
  }
});

const setPWM = (pwm) => {
  return new Promise((resolve, reject) => {
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
