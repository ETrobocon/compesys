const express = require('express');
const bodyParser = require('body-parser')
const fs = require("fs");
const router = express.Router();

router.post('/', bodyParser.raw({type: ["image/png"]}), (req, res, next) => {
    try {
        console.log(req.get('Content-Type'));
        if (req.get('Content-Type') === 'image/png') {
            res.header('Content-Type', 'application/json; charset=utf-8')
            res.status(400).json(
                {
                    status: 'Bad Request',
                    message: 'Unexpected content type',
                }
            );
            return
        }
        if (req.body === '{}') {
            res.header('Content-Type', 'application/json; charset=utf-8')
            res.status(400).json(
                {
                    status: 'Bad Request',
                    message: 'No data in request body',
                }
            );
            return
        }
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
        res.status(500).json(
            {
                status: 'Internal Server Error'
            }
        );
        return
    }
});

module.exports = router;