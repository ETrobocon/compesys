const express = require('express');
const router = express.Router();
const STATE = require('./constants').STATE;

router.get('/', (req, res, next) => {
    try {
        if (app.get('state') !== STATE.IN_COMPETITION) {
            res.status(403).json(
                {
                    status: 'Forbidden',
                    message: 'Request not currently allowed',
                }
            );
            return
        }
        const param = {'message': 'hello world'};
        res.header('Content-Type', 'application/json; charset=utf-8')
        res.send(param);
        return
    } catch (error) {
        res.header('Content-Type', 'application/json; charset=utf-8')
        res.status(500).json(
            {
                status: 'Internal Server Error'
            }
        );
        return 
    }
});

router.put('/', (req, res, next) => {
    try {
        if (app.get('state') !== STATE.IN_COMPETITION) {
            res.status(403).json(
                {
                    status: 'Forbidden',
                    message: 'Request not currently allowed',
                }
            );
            return
        }
        const pwm = Number(req.query.pwm)
        if (pwm === NaN || !(pwm >= 0 && pwm <= 100)) {
            res.header('Content-Type', 'application/json; charset=utf-8')
            res.status(400).json(
                {
                    status: 'Bad Request',
                    message: 'pwm not specified or out of range',
                }
            );
            return
        }
        const param = {'message': 'hello world'};
        res.header('Content-Type', 'application/json; charset=utf-8')
        res.send(param);
        return
    } catch (error) {
        res.header('Content-Type', 'application/json; charset=utf-8')
        res.status(500).json(
            {
                status: 'Internal Server Error',
            }
        );
        return 
    }
});

module.exports = router;