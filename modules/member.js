const MEMBER_PATH = '../settings/member/';


const fsp = require('fsp.js');

const fs = require('fs');

// INIT
if (!fs.existsSync(MEMBER_PATH)) {
    fs.mkdirSync(MEMBER_PATH);
}



function _sync() {
    var stats = fs.statSync(MEMBER_PATH);
    
}