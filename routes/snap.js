const express = require('express');
const bodyParser = require('body-parser')
const fs = require("fs");
const router = express.Router();

router.post('/', bodyParser.raw({type: ["image/png"]}), (req, res, next) => {
    try {
        fs.writeFile('image.png', req.body, (error) => {
            if (error) {
                throw error;
            }
        });
        res.header('Content-Type', 'application/json; charset=utf-8')
        res.status(201).json({status: 'Created'});
        return
    } catch (error) {
        res.header('Content-Type', 'application/json; charset=utf-8')
        res.status(500).json({status: 'Internal Server Error'});
        return
    }
});

module.exports = router;