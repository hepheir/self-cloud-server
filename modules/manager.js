'use strict';

// ######## NODE.JS MODULES ######## //

const fs = require('fs');

const log = require('./dist/log.js')
    , render = require('./dist/render.js')
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

var _settings = JSON.parse(settings_file);


// 3. Pre load <log.js> for convenience.

var _log = log(_settings.path.log);



// ######## ROOT PATH ######## //

var ROOT_PATH = _settings.path.root;

// 1. Correct the path.
if (ROOT_PATH === '')
{
    ROOT_PATH = './';
}
else {
    // Making sure `_settings.path.root` ends with '/'.
    ROOT_PATH += '/';
    ROOT_PATH = ROOT_PATH.replace('//', '/');
}


// 2. Validate the path.
if (!fs.existsSync(ROOT_PATH))
{
    _log.create(`Invalid root directory - Path: [${ROOT_PATH}]`);
    _log.create(`CLOSING SERVER...`);

    throw 404;
}

_log.create(`Set root directory - Path: [${ROOT_PATH}]`);


// ######## MODULE OUTPUTS ######## //

module.exports.settings = _settings;

module.exports.log = _log;
module.exports.render = render(_settings, _log);
// module.exports.playlist = playlist(_settings, _log);



// ######## FUNCTIONS ######## //

function JSON_RemoveComments(text) {
    return text.toString('utf-8')
        .replace(/\/\*((.|[\s+])*)\*\//g, '')
        .replace(/\/\/(.*)[\s+]/g, '');
}