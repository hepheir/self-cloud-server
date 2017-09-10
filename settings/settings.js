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
const MEMBERS = groupedDataObject(MEMBER_SETTING)
    , PATHS = groupedDataObject(PATH_SETTING);

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
    let maxlevel = MEMBERS[0];
    for (var lv = maxlevel; lv > 0; lv--) {
        let list = MEMBERS[lv];
        if (!list) {
            continue;

        } else if (list.includes(id)) {
            return lv;
        }
    }
    return 0;
}


function getPathLevel(path) {
    let maxlevel = PATHS[0],
        pathLevel = 0;
    for (var lv = maxlevel; lv > 0; lv--) {
        
        let list = PATHS[lv];
        if (!list) {
            continue;

        } else {
            list.map(elem => {
                if (path.startsWith(`${ROOT_DIRECTORY}/${elem}`)) {
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