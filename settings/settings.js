'use strict';

const MEMBER_SETTING = 'settings/member'
    , PATH_SETTING = 'settings/path';

var ROOT_DIRECTORY = '';


// MODULE

module.exports.getClientLevel = getClientLevel;
module.exports.getPathLevel = getPathLevel;
module.exports.setRootDirectory = setRootDirectory;



const fs = require('fs');

// 0th element has the maximum level index.
var MEMBERS = groupedDataObject(MEMBER_SETTING)
    , PATHS = groupedDataObject(PATH_SETTING);

// Update Level data on every minute.
setInterval(() => {
    MEMBERS = groupedDataObject(MEMBER_SETTING)
    PATHS = groupedDataObject(PATH_SETTING);
    console.log('update level data.');
}, 60000);

// This function will return a array of member lists grouped in levels.
function groupedDataObject(path) {
    let dataObject = new Array();

    let files = fs.readdirSync(path),
        maxlevel = 0;
    
    files = files.map(f => {
        let level = parseInt(f.match(/[0-9]+/)[0]);

        let list = fs.readFileSync(`${path}/${f}`)
                        .toString('utf-8')
                        .replace(/;[\s+]/g, ';')
                        .split(';');
                        
        maxlevel = maxlevel > level ?
                   maxlevel :
                   level;
        
        // If the last element of f_list is empty, pop it out.
        if (list[list.length - 1] == '') {
            list.pop();
        }

        dataObject[level] = list;
    })

    dataObject[0] = maxlevel;
    return dataObject;
}

function getClientLevel(id) {
    id = id.toString('utf-8');

    let maxlevel = MEMBERS[0];
    for (var lv = maxlevel; lv > 0; lv--) {
        let list = MEMBERS[lv];
        if (!list) {
            continue;

        } else if (list.includes(id) || list.includes('*')) {
            return lv;
        }
    }
    return 0;
}


function getPathLevel(path) {
    path = path.toString('utf-8');

    let maxlevel = PATHS[0],
        pathLevel = 0;
    
    // We only need highest level.
    for (var lv = maxlevel; lv > pathLevel; lv--) {
        
        let list = PATHS[lv];
        if (!list) {
            continue;

        } else {
            list.map(elem => {
                // A given path ends with '*' means all possible paths under the given path.
                if (elem.includes('*')) {
                    elem = elem.split('*')[0];

                    if (path.startsWith(`${ROOT_DIRECTORY}/${elem}`)
                    && !path.endsWith(`${ROOT_DIRECTORY}/${elem}`)) {
                        pathLevel = lv;
                    }

                } else if (path.startsWith(`${ROOT_DIRECTORY}/${elem}`)) {
                    pathLevel = lv;
                }
            })

        }
    }
    return pathLevel;
}


function setRootDirectory(root_dir) {
    ROOT_DIRECTORY = root_dir;
}