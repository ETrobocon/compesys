const express = require("express");
const router = express.Router();
const { logger, accesslog } = require("../logger.js");
const loggerChild = logger.child({ domain: "hello" });

router.get("/", (req, res, next) => {
  res.json({ message: "hello world" });
  next();
});

router.use(accesslog);

module.exports = router;
