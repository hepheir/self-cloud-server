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

function _createUserProfile() {
    let profile = {

    }
}

function _createDirectoryProfile() {
    let profile = {
        level: 0,
        creator: '',
        owners: [],
        files: {
            'filename': {level: 0, creator: '', owners: []},
            'filename2': {level: 0, creator: '', owners: []}
        }
    }
}