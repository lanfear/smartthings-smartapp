// eslint-disable-next-line
//require('dotenv').config();

import express from 'express'
import smartApp from './smartapp'


const server = express();
const PORT = process.env.PORT || 9190;

/* Configure Express to handle JSON lifecycle event calls from SmartThings */
server.use(express.json());
server.post('/', (req, res) => {
    void smartApp.handleHttpCallback(req, res);
});

server.get('/oauth', (req, res) => {
    console.log(JSON.stringify(req.query))
    res.send("OK")
})

/* Start listening at your defined PORT */
server.listen(PORT, () => console.log(`Server is up and running on port ${PORT}`));
