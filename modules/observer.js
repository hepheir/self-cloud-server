'use strict';

const SETTINGS_PATH = 'settings.json';

// ################################### //

const fs = require('fs');

const log = require('./dist/log.js')
    , playlist = require('./dist/playlist.js')
    , timer = require('./dist/timer.js');


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

} else {
    settings.path.root += '/';
    settings.path.root = settings.path.root.replace('//', '/');

}

log.setRoot(settings.path.log);


/* ROOT_PATH exists? */
if (!fs.existsSync(settings.path.root)) {
    throw `Invalid root directory: [${settings.path.root}]`;
}

module.exports.log = log;
module.exports.settings = settings;
module.exports.playlist = playlist;
module.exports.timer = timer;