'use strict';

const SETTINGS_PATH = 'settings.json';

// ################################### //

const fs = require('fs');

const log = require('./dist/log.js');

/* SETTINGS_PATH exists? */
if (!fs.existsSync(SETTINGS_PATH)) {
    throw "settings.json not found";
}

let json = fs.readFileSync(SETTINGS_PATH)
                     .toString('utf-8')
                     .replace(/\/\*((.|[\s+])*)\*\//g, '')
                     .replace(/\/\/(.*)[\s+]/g, '');

var settings = JSON.parse(json);

if (settings.path.root === '') {
    settings.path.root = './';
}

/* ROOT_PATH exists? */
if (!fs.existsSync(settings.path.root)) {
    throw `Invalid root directory: [${settings.path.root}]`;
}

module.exports.log = new log(settings.path.log);
module.exports.settings = settings;