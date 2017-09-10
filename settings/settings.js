'use strict';

const MEMBER_SETTING = './member'
    , PATH_SETTING = './path';


// MODULE

module.exports.getClientLevel = getClientLevel;



const fs = require('fs');

// 0th element has the maximum level index.
const MEMBERS = groupedMembers();
console.log(getClientLevel('a'));

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



// This function will return a array of member lists grouped in levels.
function groupedMembers() {
    let path = MEMBER_SETTING,
        members = new Array();

    let files = fs.readdirSync(path),
        maxlevel = 0;
    
    files = files.map(f => {
        let level = parseInt(f.match(/[0-9]+/)[0]);

        let list = fs.readFileSync(`${path}/${f}`)
                        .toString('utf-8')
                        .replace(/\s/g, '')
                        .split(';');
                        
        maxlevel = maxlevel > level ?
                   maxlevel :
                   level;
        
        // If the last element of f_list is empty, pop it out.
        if (list[list.length - 1] == '') {
            list.pop();
        }

        members[level] = list;
    })

    members[0] = maxlevel;
    return members;
}