const express = require("express");
const router = express.Router();
const { RequestError, error }= require('../custom_error.js');
const { STATE, MATCHMAKER_IP } = require("../constants");
const iottrain = require("../iottrain_central");
const { logger } = require("../logger.js");
const loggerChild = logger.child({ domain: "train" });

router.use(error);

router.get("/", (req, res) => {
  try {
    if (
      req.app.get("state") === STATE.READY ||
      req.app.get("state") === STATE.GOAL
    ) {
      throw new RequestError(403, "Request not currently allowed");
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
    res.json(param);
  } catch (error) {
    return res.status(error.statusCode).error(error);
  }
});

router.put("/", async (req, res) => {
  try {
    if (!req.app.get("allowOpReqToTrain") && req.ip !== MATCHMAKER_IP) {
      throw new RequestError(403, "Request not currently allowed");
    }
    const pwm = Number(req.query.pwm);
    if (pwm === NaN || !(pwm >= 0 && pwm <= 100)) {
      throw new RequestError(403, "pwm not specified or out of range");
    }

    const err = await iottrain.setPwm(pwm);
    if (err !== null) {
      throw err;
    }

    res.json({
      status: "OK",
    });
  } catch (error) {
    return res.status(error.statusCode).error(error);
  }
});

router.all("*", (req, res, next) => {
  next('router')
});

module.exports = router;
