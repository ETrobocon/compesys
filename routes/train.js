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

    const err = await setPWM(pwm);
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

router.all("*", (_, _, next) => {
  next('router')
});

/**
 * Set PWM value for iot train 
 * @param {number} pwm 
 * @returns 
 */
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
    return null;
  })
  .catch((error) => {
    loggerChild.error(error);
    iottrain.inbox["voltage"].value = null;
    return error;
  });
};

module.exports = router;
