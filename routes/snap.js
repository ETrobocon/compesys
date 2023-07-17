const express = require('express');
const router = express.Router();

router.post('/snap', (req, res, next) => {
    const param = {'message': 'hello world'};
    res.header('Content-Type', 'application/json; charset=utf-8')
    res.send(param);
});

module.exports = router;