const express = require("express");
const router = express.Router();
const { error }= require('../custom_error.js');
const iottrain = require("../iottrain_central");
const { logger } = require("../logger.js");
const loggerChild = logger.child({ domain: "version" });

router.use(error);

router.get("/", (req, res) => {
  try {
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

module.exports = router;
