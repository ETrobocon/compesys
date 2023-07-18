const express = require('express');
const router = express.Router();
const { STATE, TEMP_DIR } = require('../constants');

router.put('/state/:trigger', (req, res, next) => {
    try {
        const trigger = req.params.trigger
        if (trigger === 'ready') {
            app.set('state', STATE.READY);
        } else if (trigger === 'running') {
            app.set('state', STATE.RUNNING);
        } else if (trigger === 'passing') {
            app.set('state', STATE.PASSING);
        } else if (trigger === 'goal') {
            app.set('state', STATE.GOAL);
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