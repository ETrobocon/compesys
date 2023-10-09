const express = require("express");
const router = express.Router();
const { RequestError, error }= require('../custom_error.js');
const { STATE, MATCHMAKER_IP } = require("../constants");
const { getAccelerometer, getGyroscope, getVoltage, setPwm } = require("../iottrain_central");
const { logger } = require("../logger.js");
const loggerChild = logger.child({ domain: "train" });

const AsyncLock = require('async-lock');
const lock = new AsyncLock({timeout:5000});

router.use(error);

router.get("/", (req, res) => {
  lock.acquire('train-lock', () => {
    if (
      req.app.get("state") === STATE.READY ||
      req.app.get("state") === STATE.GOAL
    ) {
      throw new RequestError(403, "Request not currently allowed");
    }

    const accel = getAccelerometer();
    const gyro = getGyroscope();
    const volt = getVoltage();

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
  }).catch((error) => {
    return res.status(error.statusCode).error(error);
  });
});

router.put("/", async (req, res) => {
  lock.acquire('train-lock', async() => {
    if (!req.app.get("allowOpReqToTrain") && req.ip !== MATCHMAKER_IP) {
      throw new RequestError(403, "Request not currently allowed");
    }
    const pwm = Number(req.query.pwm);
    if (pwm === NaN || !(pwm >= 0 && pwm <= 100)) {
      throw new RequestError(403, "pwm not specified or out of range");
    }

    const err = await setPwm(pwm);
    if (err !== null) {
      throw err;
    }

    res.json({
      status: "OK",
    });
  }).catch((error) => {
    return res.status(error.statusCode).error(error);
  });
});

router.all("*", (req, res, next) => {
  next('router')
});

module.exports = router;
