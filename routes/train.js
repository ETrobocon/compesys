const express = require('express');
const router = express.Router();
const { STATE } = require('../constants');
const iottrain = require('../iottrain_central');

router.get('/', (req, res, next) => {
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

        // TODO: Iot列車からデータを取得する
        const accel = iottrain.inbox.accelerometer;
        const gyro = iottrain.inbox.gyroscope;
        const temp = iottrain.inbox.temperature;
        const volt = iottrain.inbox.voltage;

        console.log("accel@" + accel.timestamp + ": " + accel.x + ", " + accel.y + ", " + accel.z);
        console.log(" gyro@" + gyro.timestamp + ": " + gyro.x + ", " + gyro.y + ", " + gyro.z);
        console.log(" temp@" + temp.timestamp + ": " + temp.value + "℃");
        console.log(" volt@" + volt.timestamp + ": " + volt.value + "V");

        const param = {
            'accel': {
                'x': accel.x.toString(), 
                'y': accel.y.toString(),
                'z': accel.z.toString(),
            },
            'gyro': {
                'x': gyro.x.toString(), 
                'y': gyro.y.toString(),
                'z': gyro.z.toString(),
            },
            'volt': volt.value.toString(),
        };
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
        return;
    }
});

router.put('/', (req, res, next) => {
    try {
        if (!req.app.get('allowOpReqToTrain')) {       
            res.status(403).json(
                {
                    status: 'Forbidden',
                    message: 'Request not currently allowed',
                }
            );
            return;
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

        // TODO: Iot列車のPWMを設定する




        res.header('Content-Type', 'application/json; charset=utf-8')
        res.status(200).json(
            {
                status: 'OK',
            }
        );
        return;
    } catch (error) {
        res.header('Content-Type', 'application/json; charset=utf-8')
        res.status(500).json(
            {
                status: 'Internal Server Error',
            }
        );
        return; 
    }
});

module.exports = router;