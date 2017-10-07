#!/usr/bin/env node

'use strict';


// ################################### //
/* Custom Modules */
const observer = require('./modules/observer.js');

const log = observer.log;
const playlist = observer.playlist;

const HOSTNAME  = observer.settings.server.hostname
    , PORT      = observer.settings.server.port
    , ROOT_PATH = observer.settings.path.root;

/* Node Modules */
const express = require('express')
    , fs = require('fs')
    , handlebars = require('handlebars')
    , cookieParser = require('cookie-parser')
    , nodeID3 = require('node-id3');

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

    let client = req.cookies.client_id;

    if (!client || client == 'null') {
        client = 'guest';
    }

    if (!fs.existsSync(path)) {
        res.send(renderPage('error', undefined));
        return;
    }

    if (path.match('CENSORED')) {
        log.create(`{${req.ip}} <${client}> tried access to [${path}]!`);
        if (client != 'level7password') {
            res.send('no Access');
            return;
        }
    }
    log.create(`{${req.ip}} <${client}> access to [${path}]!`);

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
        res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
        source.files = files;
        content = renderPage('drive', source);
    }
    

    res.send(content);
})


let streamSection = /^\/stream(\/[^/]*)*$/;
app.all(streamSection, (req, res) => {
    var path = ROOT_PATH + decodeURIComponent(req.path.replace('/stream/', ''));

    if (!fs.existsSync(path)) {
        console.log('404: stream: ', path);
        res.send(null);
        return;
    }

    // Level ACCESS
    const stat = fs.statSync(path);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] 
            ? parseInt(parts[1], 10)
            : fileSize-1;
        const chunksize = (end-start)+1
        const file = fs.createReadStream(path, {start, end})
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        }
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        }
        res.writeHead(200, head)
        fs.createReadStream(path).pipe(res)
    }
})


let playlistSection = /^\/playlist(\/[^/]*)*$/;
app.all(playlistSection, (req, res) => {
    let client = req.cookies.client_id;

    if (!client || client == 'null') {
        client = 'guest';
    }

    if ('save' in req.query) {
        let pl_save = new Array();

        for (let url in req.query) {
            if (url == 'save') {
                continue;

            } else {
                pl_save.push(url);
            }
        }
        playlist.setPlaylist(client, pl_save);

        res.send();
        return;
    }

    let pl_load = playlist.getPlaylist(client);

    pl_load = JSON.stringify(pl_load);
    res.setHeader('Content-Type', 'application/json');
    res.send(pl_load);
})


let mp3tagSection = /^\/mp3(\/[^/]*)*$/;
app.all(mp3tagSection, (req, res) => {
    var path = ROOT_PATH + decodeURIComponent(req.path.replace('/mp3/', ''));

    let tags = nodeID3.read(path);

    let content = new Object();

    content.title = tags.title;
    content.artist = tags.artist || tags.composer || tags.album;
    content.src = decodeURIComponent(req.path.replace('/mp3/', '/stream/'));

    res.send(content);
})


app.all('/', (req, res) => {
    res.send('<script>location.replace("./drive/");</script>');
})

// disable HOST NAME
app.listen(PORT, () => {
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
            secured: (file.match('CENSORED') != null)
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