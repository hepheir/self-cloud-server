'use strict';

var date;

const fs = require('fs');


function _log(LOG_PATH)
{
    let LASTEST_LOG = '',
        L_LOG_TIME = 0;
    
    // 1. Get the lastest log message.
    function _lastest() {
        return LASTEST_LOG;
    }
    
    // 2. Create a new log file.
    function _new()
    {
        date = new Date();

        // YYYYMMDD
        let file = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`;

        let path = LOG_PATH + file;

        if (!fs.existsSync(path))
        {
            let CUR_TIME = date.toTimeString();

            fs.closeSync(fs.openSync(path, 'a'));
            console.log(`[${path}] created.`);
    
            fs.writeFileSync(path, `[${CUR_TIME}]\n\t[${path}] was created.`);
            L_LOG_TIME = CUR_TIME;
        }

        return path;
    }

    // 3. Log a new message.
    function _create(msg)
    {
        date = new Date();

        // 3-1. One log file for each dates.
        let path = _new();

        let message;

        // 3-2. Use '*' for the duplicated messages.
        if (msg === LASTEST_LOG) {
            message = '*';
        }
        // 3-3. Regular log.
        else
        {
            message = '\n';

            console.log(msg);
            LASTEST_LOG = msg;

            let CUR_TIME = date.toTimeString();

            // 3-3-1. If multiple logs registered in a second, skip time recording.
            if (L_LOG_TIME !== CUR_TIME)
            {
                message += `[${CUR_TIME}]\n`;
                L_LOG_TIME = CUR_TIME;
            }

            message += `\t${msg} `;
        }

        // 3-3. Record.
        fs.appendFileSync(path, message, 'utf-8');
    }


    return {
        lastest: _lastest,
        create: _create
    };
}

// ######## MODULE EXPORTS ######## //

module.exports = _log;