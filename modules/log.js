'use strict';

const LOG = 'log.txt';


const fs = require('fs')
    , date = new Date();


// MODULE //

module.exports.create = _create();

// Log file is created if it does not exist. //
fs.openSync(LOG, 'a+');



function _create() {

    var lastestLog;

    return (msg) => {
        fs.readFile(LOG, 'utf8', (err, history) => {
            
            let newLog;
            if (lastestLog === msg) {
                newLog = '*';
    
            } else {
                let time = date.toLocaleString();
    
                newLog = `\n[${time}] ${msg}`;
    
                lastestLog = newLog;
                console.log(msg);
            }
            fs.writeFileSync(LOG, history + newLog);
        })
    }
}
