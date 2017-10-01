'use strict';

const LOG_PATH = 'log.txt';


const fs = require('fs')
    , fsp = require('./fsp.js')
    , date = new Date();


// MODULE //

module.exports.create = _create();

// Log file is created if it does not exist. //
if (!fs.existsSync(LOG_PATH)) {
    fsp.createFileSync(LOG_PATH);
    module.exports.create(`[${LOG_PATH}] created.`);
}



function _create() {

    var lastestLog;

    return (msg) => {
        fs.readFile(LOG_PATH, 'utf8', (err, history) => {
            if (err) {
                throw err;
            }
            
            let newLog;
            if (lastestLog === msg) {
                newLog = '*';
    
            } else {
                let time = date.toLocaleString();
    
                newLog = `\n[${time}] ${msg}`;
    
                lastestLog = newLog;
                console.log(msg);
            }
            fs.writeFileSync(LOG_PATH, history + newLog);
        })
    }
}
