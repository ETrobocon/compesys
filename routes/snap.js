const express = require('express');
const bodyParser = require('body-parser')
const fs = require("fs");
const router = express.Router();

router.post('/', bodyParser.raw({type: ["image/png"]}), (req, res, next) => {
    fs.writeFile('image.jpeg', req.body, (error) => {
        if (error) {
            throw error;
        }
    });
    res.header('Content-Type', 'application/json; charset=utf-8')
    res.status(201).json({status: 'Created'});
    return
});

module.exports = router;