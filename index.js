#!/usr/bin/env node

'use strict';

// ################################### //

// Custom Modules

const observer = require('./modules/observer.js');

const log   = observer.log
    , pl    = observer.playlist
    , timer = observer.timer;

const HOSTNAME  = observer.settings.server.hostname
    , PORT      = observer.settings.server.port
    , ROOT_PATH = observer.settings.path.root;

const SUPPORTED_MEDIA_TYPES = observer.settings.supported_media_types;

// NPM Modules

const fs = require('fs')
    , express = require('express')
    , cookieParser = require('cookie-parser');

// Express.js setting

const app = express();
app.use(cookieParser());
app.use(express.static('app'));


// ################################### //

// Routers

app.all('/', (req, res) => {
    res.send('<script>location.replace("./drive/");</script>');
})

// Render Pages
let driveSection = /^\/drive\//;
app.all(driveSection, (req, res) => {
    log.create(`<${req.ip}> Rendering UI for client.`);
    
    var path = getPath(req.path.replace(driveSection, ''));

    let files = [
        fs.readFileSync('app/header.partial.html'),
        fs.readFileSync(`app/stat/explorer/index.html`),
        fs.readFileSync(`app/stat/audio-player/index.html`),
        fs.readFileSync('app/footer.partial.html')
    ]

    Promise.all(files)
        .then(files => files = files.map(f => f = f.toString('utf-8')))
        .then(files => {
            const content = files.join('');

            res.send(content);
        })
})


// Render JSON data of a directory.
let driveJsonSection = /^\/json\//;
app.all(driveJsonSection, (req, res) => {
    var path = getPath(req.path.replace(driveJsonSection, ''));

    // Error handler
    if (!fs.existsSync(path)) {
        res.json({error: 'not found!'});
        return;

    } else if (!fs.statSync(path).isDirectory()) {
        res.json({error: 'not a directory!'});
        return;
    }
    

    timer.start('loading!');

    // Parse directory data into useful form.
    let files = fs.readdirSync(path).map(f => {
        let source = {
            name: f,
            type: fileType(path + f),
            secured: false // not yet.
        }

        if (source.type == 'folder') {
            source.name += '/';
        }

        return source;
    });

    // Temporal action to prevent mac OS hidden files from appearing. + and unwanted files.
    files = files.filter(f => {
        return !f.name.includes('._') && !f.name.includes('CENSORED');
    })
    

    res.json(files);
    
    // Time time time
    let speed = timer.end('finished loading');
    log.create(`<${req.ip}> accessed to [${path}], JSON rendering took ${speed} ms.`);
})


let playlistSection = /^\/playlist\//;
app.all(playlistSection, (req, res) => {
    let params = req.path.replace(playlistSection, '').split('/');

    // 1. Get user data from path string. >> /playlist/:userID/:playlistID/
    let clientID = params[0],
        playlistID = params[1];

    // 2. is save mode?
    if ('save' in req.query) {
        let playlist = new Array();

        // 2-1. Each value has path string that is encoded by encodeURIcompoent().
        for (let key in req.query) {
            if (key == 'save') {
                continue
            }
            playlist.push(decodeURIComponent(req.query[key]));
        }

        // 2-2. Save the playlist using custom module.
        pl.setPlaylist(clientID, playlistID, playlist);
    
    // 3. Record what's going on.
        log.create(`<${req.ip}> (${clientID}) saved playlist (${playlistID}).`);
    } else {
        log.create(`<${req.ip}> (${clientID}) downloaded playlist (${playlistID}).`);
    }

    // 4. Get the playlist using custom module.
    let content = pl.getPlaylist(clientID, playlistID);

    res.json(content);
})

let streamSection = /^\/stream\//;
app.all(streamSection, (req, res) => {
    var path = getPath(req.path.replace(streamSection, ''));

    if (!fs.existsSync(path)) {
        console.log('404: stream: ', path);
        res.send(null);
        return;
    }

    log.create(`<${req.ip}> downloaded [${path}]`);

    let filetype = fileType(path),
        extension = path.match(/[^.]+$/)[0];

    if (extension == 'mp3') {
        extension = 'mpeg';
    }

    let contentType = `${filetype}/${extension}`;

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
            'Content-Type': contentType,
        }
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': contentType,
        }
        res.writeHead(200, head)
        fs.createReadStream(path).pipe(res)
    }
})


// ################################### //

// Launch Server!

app.listen(PORT, () => {
    log.create(`\nSet root directory [${ROOT_PATH}]\nSelf-cloud-server listening on [${HOSTNAME}:${PORT}]!`);
})

app.listen(80, () => {
    log.create(`Listening to Secondary port [${HOSTNAME}:${80}]!`);
})

// ################################### //

// Functions

function getPath(path) {
    path = ROOT_PATH + decodeURIComponent(path);
    path = path.replace('//', '/');
    return path;
}



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