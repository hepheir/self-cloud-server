'use strict';

// ######## NODE.JS MODULES ######## //

const fs = require('fs');

const log = require('./dist/log.js')
    , playlist = require('./dist/playlist.js');



// ######## BOOTING SEQUENCE ######## //

const SETTINGS_PATH = 'data/settings.json';

var date = new Date();

// 1. Check SETTINGS_PATH exists
if (!fs.existsSync(SETTINGS_PATH))
{
    console.log(`[${SETTINGS_PATH}] not found`);
    throw 404;
}


// 2. Load Settings JSON.
let settings_file;

settings_file = fs.readFileSync(SETTINGS_PATH);
settings_file = JSON_RemoveComments(settings_file);

const settings = JSON.parse(settings_file);



// ######## ROOT PATH ######## //

var ROOT_PATH = settings.path.root;

// 1. Correct the path.
if (ROOT_PATH === '')
{
    ROOT_PATH = './';
}
else {
    // Making sure `settings.path.root` ends with '/'.
    ROOT_PATH += '/';
    ROOT_PATH = ROOT_PATH.replace('//', '/');
}


// 2. Validate the path.
if (!fs.existsSync(ROOT_PATH))
{
    console.log(`Invalid root directory: [${ROOT_PATH}]`);
    throw 300;
}


// ######## MODULE OUTPUTS ######## //

var _log = log(settings.path.log);

module.exports.settings = settings;

module.exports.log = _log;
module.exports.playlist = playlist(settings.path.playlist, _log);



// ######## FUNCTIONS ######## //

function JSON_RemoveComments(text) {
    return text.toString('utf-8')
        .replace(/\/\*((.|[\s+])*)\*\//g, '')
        .replace(/\/\/(.*)[\s+]/g, '');
}