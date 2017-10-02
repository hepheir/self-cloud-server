'use strict';

const SETTINGS_PATH = 'settings.json';

// ################################### //

const fs = require('fs');

const log = require('./dist/log.js');

/* SETTINGS_PATH exists? */
if (!fs.existsSync(SETTINGS_PATH)) {
    console.log(`Error: [${SETTINGS_PATH}] not found.`);
    throw Error;
}

const settings = JSON.parse(
    fs.readFileSync(SETTINGS_PATH)
        .toString('utf-8')
        .replace(/\/\/(.*)[\n]/g, '')
);

/* ROOT_PATH exists? */
if (!fs.existsSync(settings.path.root)) {
    console.log(`Error: [${settings.path.root}] not found.`);
    throw Error;
}

module.exports.log = new log(settings.path.log);
module.exports.settings = settings;