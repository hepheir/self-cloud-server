'use strict';

const HOSTNAME = 'localhost'
    , PORT = 3000;

const ROOT_DIR = 'G:/Database';


// ################################### //
const log = require('./modules/log.js');

// ################################### //
const express = require('express')
    , fs = require('fs')
    , handlebars = require('handlebars')
    , cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());

app.get('', (req, res) => {
    res.send();
})

app.listen(PORT, HOSTNAME, () => {
    log.create(`Self-cloud-server listening on [${HOSTNAME}:${PORT}]!`);
})