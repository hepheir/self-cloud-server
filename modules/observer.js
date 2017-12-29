'use strict';

const SETTINGS_PATH = 'data/settings.json';

// ################################### //

const fs = require('fs');

const log = require('./dist/log.js')
    , timer = require('./dist/timer.js')
    , playlist = require('./dist/playlist.js');


// Check SETTINGS_PATH exists
if (!fs.existsSync(SETTINGS_PATH)) {
    console.log(`[${SETTINGS_PATH}] not found`);
    throw null;
}

var settings = JSON.parse(JSON_RemoveComments(fs.readFileSync(SETTINGS_PATH)));

if (settings.path.root === '') {
    settings.path.root = './';
} else {
    // To make sure `settings.path.root` ends with '/'.
    settings.path.root += '/';
    settings.path.root = settings.path.root.replace('//', '/');
}

// Check ROOT_PATH exists
if (!fs.existsSync(settings.path.root)) {
    console.log(`Invalid root directory: [${settings.path.root}]`);
    throw null;
}

// Applying settings data.

log.setLogPath(settings.path.log);
playlist.setPlaylistPath(settings.path.playlist);


// Module outputs

module.exports.log = log;
module.exports.settings = settings;
module.exports.playlist = playlist;
module.exports.timer = timer;


// Functions

function JSON_RemoveComments(text) {
    return text.toString('utf-8')
                .replace(/\/\*((.|[\s+])*)\*\//g, '')
                .replace(/\/\/(.*)[\s+]/g, '');
}