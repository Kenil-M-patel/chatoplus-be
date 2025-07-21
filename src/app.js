require('dotenv').config();
require('./config/dbConnect');

const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const path = require('path');
const http = require("http");
const router = require('./api');

const port = process.env.PORT || 5050;
const app = express();

const server = http.createServer(app);
const { initSocket } = require("./socket/socket");

app.set('trust proxy', true);
app.use(cookieParser());
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', router);
initSocket(server);


// Test route
app.get('/', (req, res) => {
    console.log('Cookies:', req.cookies);
    res.send('Server is running!');
});


server.listen(port, () => {
    console.log('Server start', port);
});