const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    const param = {'message': 'hello world'};
    res.header('Content-Type', 'application/json; charset=utf-8')
    res.send(param);
});

router.put('/', (req, res, next) => {
    const pwm = Number(req.query.pwm)
    if (pwm === NaN || !(pwm >= 0 && pwm <= 100)) {
        res.header('Content-Type', 'application/json; charset=utf-8')
        res.status(400).json({status: 'Bad Request'});
    }
    const param = {'message': 'hello world'};
    res.header('Content-Type', 'application/json; charset=utf-8')
    res.send(param);
});

module.exports = router;