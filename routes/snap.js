const bodyParser = require('body-parser')
const fs = require("fs");
const express = require('express');
const router = express.Router();
const { STATE, TEMP_DIR } = require('../constants');

router.post('/', bodyParser.raw({type: ["image/png"]}), (req, res, next) => {
    try {
        if ( app.get('state') === STATE.READY ||
            app.get('state') === STATE.GOAL) {
            
            res.status(403).json(
                {
                    status: 'Forbidden',
                    message: 'Request not currently allowed',
                }
            );
            return
        }
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