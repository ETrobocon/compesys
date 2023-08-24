const express = require("express");
const router = express.Router();
const { error }= require('../custom_error.js');
const iottrain = require("../iottrain_central");
const { logger } = require("../logger.js");
const loggerChild = logger.child({ domain: "version" });

router.use(error);

router.get("/", async(req, res) => {
  try {
    const err = await getMaBeeeName();
    if (err !== null) {
      throw err;
    }
    res.json({ 
        compesys: `${process.env.npm_package_version}`, 
        iot_train: iottrain.inbox["version"],
        mabeee_name: iottrain.inbox["mabeee"].name,
    });
  } catch (error) {
    return res.status(error.statusCode).error(error);
  } 
});

router.all("*", (req, res, next) => {
  next('router')
});

/**
 * Get MaBeee Name
 */
const getMaBeeeName = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject('timeout'), 10000);
    iottrain.characteristics["mabeeeName"].instance.read((error, data) => {
      if (error !== null) {
        return reject(error);
      }
      return resolve(data);
    });
  })
  .then((data) => {
    console.log(data)
    iottrain.inbox["mabeee"].name = data.toString();
    return null;
  })
  .catch((error) => {
    loggerChild.error(error);
    iottrain.inbox["mabeee"].name = null;
    return error;
  });
};

module.exports = router;
