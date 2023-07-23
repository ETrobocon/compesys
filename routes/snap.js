const bodyParser = require('body-parser')
const fs = require("fs");
const express = require('express');
const router = express.Router();
const { STATE, TEMP_DIR } = require('../constants');

router.post('/', bodyParser.raw({type: ["image/png"], limit: ['10mb']}), (req, res) => {
    try {
        if ( req.app.get('state') === STATE.READY ||
            req.app.get('state') === STATE.GOAL) {
            
            res.status(403).json(
                {
                    status: 'Forbidden',
                    message: 'Request not currently allowed',
                }
            );
            return;
        }
        const id = req.query.id
        if (id === '') {
            res.header('Content-Type', 'application/json; charset=utf-8')
            res.status(400).json(
                {
                    status: 'Bad Request',
                    message: 'ID not specified or not numeric',
                }
            );
            return
        }
        if (req.get('Content-Type') !== 'image/png') {
            res.header('Content-Type', 'application/json; charset=utf-8')
            res.status(400).json(
                {
                    status: 'Bad Request',
                    message: 'Unexpected content type',
                }
            );
            return
        }
        const now = new Date();
        const date = now.getFullYear() 
            + ('0' + (now.getMonth() + 1)).slice(-2) 
            + ('0' + now.getDate()).slice(-2)
            + ('0' + now.getHours()).slice(-2)
            + ('0' + now.getMinutes()).slice(-2)
            + ('0' + now.getSeconds()).slice(-2)
        const directoryPath = `${TEMP_DIR}/${id}`    
        const path = `${TEMP_DIR}/${id}/${id}_${date}.png`
        if(!fs.existsSync(directoryPath)){
            fs.mkdir(directoryPath, (err) => {
                if (err) { throw err; }
                fs.chmodSync(directoryPath, 0o777,  (err) => {
                    if (err) { throw err; }
                });
            });
        }
        fs.writeFile(path, req.body, 'binary', (err) => {
            if (err) { throw err; }
            fs.chmodSync(path, 0o777,  (err) => {
                if (err) { throw err; }
            });
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