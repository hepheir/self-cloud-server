#!/usr/bin/env node

'use strict';


// ################################### //
/* Custom Modules */
const observer = require('./modules/observer.js');

const log = observer.log;

const HOSTNAME  = observer.settings.server.hostname
    , PORT      = observer.settings.server.port
    , ROOT_PATH = observer.settings.path.root;

/* Node Modules */
const express = require('express')
    , fs = require('fs')
    , handlebars = require('handlebars')
    , cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());
app.use(express.static('frontend/app'));

handlebars.registerHelper('ifNotEq', function (a, b, opts) {
    if (a !== b) {
        return opts.fn(this);
    }
});
handlebars.registerHelper('ifEq', function (a, b, opts) {
    if (a === b) {
        return opts.fn(this);
    }
});

// ################################### //
/* drive */
let driveSection = /^\/drive(\/[^/]*)*$/;
app.all(driveSection, (req, res) => {
    var path = ROOT_PATH + decodeURIComponent(req.path.replace('/drive/', ''));

    console.log(path);

    if (!fs.existsSync(path)) {
        res.send(renderPage('error', undefined));
        return;
    }

    // Level ACCESS
    req.type = fileType(path);

    if (req.type != 'folder') {
        res.send(renderPage('file', undefined));
        return;
    }

    let content,
        source = new Object();

    let files = readDirJSON(path);
    if ('json' in req.query) {
        content = JSON.stringify(files);
        source = undefined;

        res.setHeader('Access-Control-Allow-Headers', '*');
    } else {
        source.files = files;
        content = renderPage('drive', source);
    }
    

    res.send(content);
})


app.listen(PORT, HOSTNAME, () => {
    log.create(`\nSet root directory [${ROOT_PATH}]\nSelf-cloud-server listening on [${HOSTNAME}:${PORT}]!`);
})

// ################################### //

/**
 * Create a html document.
 * 
 * @param {string} type 
 * @param {!CompileOptions} source 
 * @return {HTMLDocument}
 */
function renderPage(type, source) {
    if (!type) {
        return false;
    }

    let files = [
        fs.readFileSync('frontend/header.partial.html'),
        fs.readFileSync(`frontend/${type}/index.html`),
        fs.readFileSync('frontend/footer.partial.html')
    ];

    files = files.map(f => f.toString('utf-8'));
    files = files.join('');

    return handlebars.compile(files)(source);
}

/**
 * Read a directory and returns an array of JSON data.
 * 
 * @param {String} path 
 * @return {[{name: String, type: String, secured: Boolean}]}
 */
function readDirJSON(path) {
    path += '/';
    path = path.replace('//', '/');

    if (!fs.existsSync(path)) {
        return null;
    }

    let files = fs.readdirSync(path),
        file_id = 1;

    files = files.map(file => {
        let type = fileType(path + file);
        
        if (type === 'folder') {
            file += '/';
        }

        return {
            id: 'file_' + file_id++,
            name: file,
            type: type,
            secured: false
        };
    })
    return files;
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