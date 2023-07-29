const express = require('express');
const router = express.Router();
const { logger } = require('../logger.js');
const loggerChild = logger.child({ domain: 'hello' })

router.get('/', (req, res, next) => {
    try {
        const param = {'message': 'hello world'};
        res.header('Content-Type', 'application/json; charset=utf-8')
        res.send(param);
        return;
    } catch (error) {
        loggerChild.error(error);
        res.header('Content-Type', 'application/json; charset=utf-8')
        res.status(500).json(
            {
                status: 'Internal Server Error'
            }
        );
        return;
    } finally {
        loggerChild.info(req.method + ' ' + req.originalUrl + ' code: ' + res.statusCode);
        return;
    }
});

module.exports = router;