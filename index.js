#!/usr/bin/env node

const PORT = 80;

// ################################### //

'use strict';

const fs = require('fs');
const express = require('express');

// ################################### //

const app = app_create();

function _main_() {
    app.get(/.*/,  router_renderUI);
    app.post(/.*/, router_readDir);

    app_listen();
}

// ################################### //

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

// ################################### //

function router_renderUI(req, res) {
    // Not Prepared Yet.
}

function router_readDir(req, res) {
    let content;

    content = fs.readdirSync('G:/Database/');
    content = JSON.stringify(content);

    res.send(content);
}

// ################################### //

_main_();