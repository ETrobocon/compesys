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

        // 出力先のzipファイル名
        const zipPath = `${TEMP_DIR}/${id}.zip`;
        const targetDirectory = `${TEMP_DIR}/${id}`;

        // ストリームを生成して、archiverと紐付ける
        const archive = archiver.create('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });
        const output = fs.createWriteStream(zipPath);
        archive.pipe(output);

        // 圧縮対象のファイル及びフォルダ
        archive.directory(targetDirectory, false);


        // zip圧縮実行
        archive.finalize();
        output.on("close", () => {
            // zip圧縮完了すると発火する
            // const archive_size = archive.pointer();
            // console.log(`complete! total size : ${archive_size} bytes`);
            
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