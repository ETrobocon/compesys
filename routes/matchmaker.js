const archiver = require('archiver');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const { STATE, TEMP_DIR } = require('../constants');

router.put('/state/:trigger', (req, res, next) => {
    try {
        const trigger = req.params.trigger
        if (trigger === 'ready') {
            req.app.set('state', STATE.READY);
            req.app.set('allowOpReqToTrain', false);
        } else if (trigger === 'running') {
            req.app.set('state', STATE.RUNNING);
            setTimeout(() => {
                if (req.app.get('state') === STATE.RUNNING) {
                    req.app.set('allowOpReqToTrain', true);
                }
            }, 10000)
        } else if (trigger === 'passing') {
            req.app.set('state', STATE.PASSING);
            req.app.set('allowOpReqToTrain', true);
        } else if (trigger === 'goal') {
            req.app.set('state', STATE.GOAL);
            req.app.set('allowOpReqToTrain', false);
        }
        
        res.header('Content-Type', 'application/json; charset=utf-8')
        res.status(200).json(
            {
                status: 'OK',
            }
        );
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

router.get('/image/:id', (req, res, next) => {
    try {
        const id = req.params.id

        const zipPath = `${TEMP_DIR}/${id}.zip`;
        const targetDirectory = `${TEMP_DIR}/${id}`;

        const archive = archiver.create('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });
        const output = fs.createWriteStream(zipPath);
        archive.pipe(output);

        archive.directory(targetDirectory, false);

        archive.finalize();
        output.on("close", () => {
            res.header('Content-Type', 'application/zip;')
            res.header('Content-Disposition', 'attachment;')
            res.status(200).sendFile(zipPath);           
            return
        });
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