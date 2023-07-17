const express = require('express');
const app = express();

const hello = require('./routes/hello');
const snap = require('./routes/snap');
const train = require('./routes/train');

app.use('/', hello);  
app.use('/snap', snap);   
app.use('/train', train);

const server = app.listen(8080, () => {
    console.log("Node.js is listening to PORT:" + server.address().port);
});
