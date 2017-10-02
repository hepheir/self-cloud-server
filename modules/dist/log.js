'use strict';

const fs = require('fs')
    , date = new Date();

/**
 * History log for server management & maintenance.
 * @param {String} path 
 */
function LOG(path) {
    this.LOG_PATH = path;
    this.lastestLog = '';

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
LOG.prototype.create = function(msg) {
    let history = fs.readFileSync(this.LOG_PATH),
        newLog;

    if (this.lastestLog === msg) {
        newLog = '*';

    } else {
        console.log(msg);
        this.lastestLog = newLog;
        
        newLog = `\n[${date.toLocaleString()}] ${msg}`;
    }
    fs.writeFileSync(this.LOG_PATH, history + newLog);
}

module.exports = LOG;