const express = require('express')
const app = express()

const server = app.listen(8080, () => {
    console.log("Node.js is listening to PORT:" + server.address().port);
});

app.get('/', (req, res) => {
    res.json({ 'message': 'hello world' })
})