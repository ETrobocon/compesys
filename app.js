require('dotenv').config()
const fs = require('fs');
const express = require('express');
const app = express();

const { STATE, TEMP_DIR } = require('./constants');

const hello = require('./routes/hello');
const snap = require('./routes/snap');
const train = require('./routes/train');
const matchmaker = require('./routes/matchmaker');

app.use('/', hello);  
app.use('/snap', snap);   
app.use('/train', train);
app.use('/matchmaker', matchmaker);
app.set('state', STATE.UNDEFINDED);

// 一時フォルダの初期化
if(fs.existsSync(TEMP_DIR) ){
    const dir = TEMP_DIR;
    fs.readdir(dir, (err, files) => {
        if(err){
            throw err;
        }
        files.forEach((file) => {
            fs.unlink(`${dir}/${file}`, (err) => {
                if(err){
                    throw(err);
                }
                console.log(`deleted ${file}`);
            });
        });
    });
} else {
    fs.mkdir(TEMP_DIR, (err) => {
        if (err) { throw err; }
    });
}

const server = app.listen(process.env.LISTEN_PORT, () => {
    console.log("Node.js is listening to PORT:" + server.address().port);
});
