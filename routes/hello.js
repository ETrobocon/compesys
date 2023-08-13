const express = require("express");
const router = express.Router();
const { logger, accesslog } = require("../logger.js");
const loggerChild = logger.child({ domain: "hello" });

router.get("/", (req, res) => {
  try {
    res.json({ message: "hello world" });
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

module.exports = router;
