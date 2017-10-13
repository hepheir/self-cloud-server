'use strict';

const fs = require('fs')
    , date = new Date();

var LASTEST_LOG = '';

// Path

var LOG_PATH;

// Module

module.exports.setLogPath = setLogPath; // Initializer

module.exports.create = create;


// FUNCTIONS

function setLogPath(path) {
    LOG_PATH = path;
    
    if (!fs.existsSync(path)) {
        // Create a new log file.
        fs.closeSync(fs.openSync(path, 'w'));

        console.log(`[${path}] created.`);
        fs.writeFileSync(path, `[${date.toLocaleString()}] [${path}] created.`);
    }
}

/**
 * Create a log record of the message.
 * @param {String} message 
 */
function create(message) {
    let history  = fs.readFileSync(LOG_PATH),
        addition;

    if (LASTEST_LOG === message) {
        addition = '*';

    } else {
        addition = `\n[${date.toLocaleString()}] ${message} `;

        console.log(message);
        LASTEST_LOG = message;
    }

    fs.writeFileSync(LOG_PATH, history + addition);
}