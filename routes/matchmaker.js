const express = require('express');
const router = express.Router();
const STATE = require('./constants').STATE;

router.put('/state/:trigger', (req, res, next) => {
    try {
        const trigger = req.params.trigger
        if (trigger === 'start') {
            app.set('state', STATE.IN_COMPETITION);
        } else if (trigger === 'end') {
            app.set('state', STATE.STAND_BY);
        }
        
        const param = {'message': 'hello world'};
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
        return 
    }
});

module.exports = router;