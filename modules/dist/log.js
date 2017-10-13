'use strict';

const fs = require('fs')
    , date = new Date();

var LOG_PATH;


var lastestLog = '';


/**
 * History log for server management & maintenance.
 * @param {String} path 
 */
function _setRoot(path) {
    LOG_PATH = path;

    if (!fs.existsSync(path)) {
        // Create a new log file.
        fs.closeSync(fs.openSync(path, 'w'));

        console.log(`[${path}] created.`);
        fs.writeFileSync(path, `[${date.toLocaleString()}] [${path}] created.`);
    }
}

/**
 * Create a log and record the message on the specified file.
 * @param {String} msg 
 */
function _create(msg) {
    let history = fs.readFileSync(LOG_PATH),
        newLog;

    if (lastestLog === msg) {
        newLog = '*';

    } else {
        console.log(msg);
        lastestLog = msg;
        
        newLog = `\n[${date.toLocaleString()}] ${msg} `;
    }
    fs.writeFileSync(LOG_PATH, history + newLog);
}

module.exports.setRoot = _setRoot;
module.exports.create = _create;