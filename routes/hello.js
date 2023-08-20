const express = require("express");
const router = express.Router();
const { logger } = require("../logger.js");
const loggerChild = logger.child({ domain: "hello" });

router.get("/", (_, res) => {
  res.json({ 
    status: "OK", 
    message: "hello world" 
  });
});

router.all("*", (_, _, next) => {
  next('router')
});

module.exports = router;
