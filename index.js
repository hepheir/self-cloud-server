#!/usr/bin/env node

const PORT = 80;
const ROOT = 'G:/Database/';


'use strict';

const fs = require('fs');
const express = require('express');


const app = app_create();

function _main_() {
    app.get(/.*/,  router_renderUI);
    app.post('/path/*', router_readDir);
    app.post('/file/*', router_readDir);

    app_listen();
}


function app_create() {
    let app;

    app = express();
    app.use(express.static('app'));

    return app;
}

function app_listen() {
    app.listen(PORT, () => {
        console.log(`Self-cloud-server listening on [${PORT}]!`);
    });
}

function router_renderUI(req, res) {
    //
}

function router_readDir(req, res) {
    let path = req.params[0];

    let content;

    content = fs.readdirSync(ROOT + path);
    content = JSON.stringify(content);

    res.send(content);
}

function router_getFile(req, res) {
    // Not Prepared Yet.
}

_main_();