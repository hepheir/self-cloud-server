'use strict';

const HOSTNAME = 'localhost'
    , PORT = 3000;

// Mac: '/Volumes/Hepheir/Database'
// Win: 'G:/Database'
const ROOT_DIR = './ex_directory/';


// ################################### //
const log = require('./modules/log.js')
    , fsp = require('./modules/fsp.js');

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