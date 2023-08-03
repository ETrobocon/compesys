const express = require("express");
const router = express.Router();
const { logger } = require("../logger.js");
const loggerChild = logger.child({ domain: "hello" });

router.get("/", (req, res) => {
  try {
    res.header("Content-Type", "application/json; charset=utf-8");
    res.send({ message: "hello world" });
  } catch (error) {
    loggerChild.error(error);
    res.header("Content-Type", "application/json; charset=utf-8");
    res.status(500).json({
      status: "Internal Server Error",
    });
  } finally {
    loggerChild.info(
      req.method + " " + req.originalUrl + " code: " + res.statusCode
    );
  }
});

module.exports = router;
