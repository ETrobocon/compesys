require('dotenv').config()
const express = require('express');
const app = express();

const STATE = require('./constants').STATE;

const hello = require('./routes/hello');
const snap = require('./routes/snap');
const train = require('./routes/train');
const matchmaker = require('./routes/matchmaker');

app.use('/', hello);  
app.use('/snap', snap);   
app.use('/train', train);
app.use('/matchmaker', matchmaker);
app.set('state', STATE.STAND_BY);

const server = app.listen(process.env.LISTEN_PORT, () => {
    console.log("Node.js is listening to PORT:" + server.address().port);
});
