#!/usr/bin/env node

'use strict';

// ################################### //
/* Custom Modules */
const observer = require('./modules/observer.js');

const log = observer.log
    , playlist = observer.playlist
    , timer = observer.timer;

const HOSTNAME  = observer.settings.server.hostname
    , PORT      = observer.settings.server.port
    , ROOT_PATH = observer.settings.path.root;

const fs = require('fs')
    , express = require('express')
    , cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());
app.use(express.static('frontend/app'));


// LOBBY
app.all('/', (req, res) => {
    res.send('<script>location.replace("./drive/");</script>');
})

let driveSection = /^\/drive\//;
app.all(driveSection, (req, res) => {
    var path = getPath(req.path.replace(driveSection, ''));

    let files = [
        fs.readFileSync('frontend/header.partial.html'),
        fs.readFileSync(`frontend/app/stat/explorer/index.html`),
        fs.readFileSync('frontend/footer.partial.html')
    ]

    Promise.all(files)
        .then(files => files = files.map(f => f = f.toString('utf-8')))
        .then(files => {
            const content = files.join('');

            res.send(content);
        })
})

console.log(ROOT_PATH);

let driveJsonSection = /^\/json\//;
app.all(driveJsonSection, (req, res) => {
    var path = getPath(req.path.replace(driveJsonSection, ''));

    if (!fs.existsSync(path)) {
        console.log('not found!', path);
        res.send(null);
        return;
    }
    console.log('loading!');
    let start = Date.now();

    let files = fs.readdirSync(path);
    
    files = files.map(f => {
        let file = {
            name: f,
            type: fileType(path + f),
            secured: false
        }

        if (file.type == 'folder') {
            file.name += '/';
        }

        return file;
    })

    let content = JSON.stringify(files);
    res.send(content);
    
    console.log(`finished loading,\ntook ${Date.now() - start} ms`);
})

// disable HOST NAME
app.listen(PORT, () => {
    log.create(`\nSet root directory [${ROOT_PATH}]\nSelf-cloud-server listening on [${HOSTNAME}:${PORT}]!`);
})



function getPath(path) {
    path = ROOT_PATH + decodeURIComponent(path);
    path = path.replace('//', '/');
    return path;
}


// Supported Media Types
const SUPPORTED_MEDIA_TYPES = {
    audio: ['mp3', 'ogg', 'wav'],
    video: ['mp4', 'webm', 'ogg'],
    //text : ['txt'],
    code : ['c', 'cp', 'cpp', 'python', 'js', 'html', 'css']
};

/**
 * Return the type of a file.
 * @param {string} path 
 * @return {string}
 */
function fileType(path) {
    if (!fs.existsSync(path)) {
        return null;
    }

    let stat = fs.statSync(path);
    if (stat.isDirectory()) {
        return 'folder';
    }

    let extension = path.match(/([^.]*)$/)[0];

    for (let type in SUPPORTED_MEDIA_TYPES) {
        if (SUPPORTED_MEDIA_TYPES[type].includes(extension)) {
            return type;
        }
    }
    return 'file';
}