#!/usr/bin/env node

'use strict';

// ################################### //

// Custom Modules

const manager = require('./modules/manager.js');

const log   = manager.log
    , render = manager.render
    , pl    = manager.playlist;

const HOSTNAME  = manager.settings.server.hostname
    , PORT      = manager.settings.server.port
    , ROOT_PATH = manager.settings.path.root;

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
app.all(driveSection, (req, res) =>
{
    const content = render.getPage('explorer');

    log.create(`HTML page has rendered.`);
    res.send(content);
})


// Render JSON data of a directory.
let driveJsonSection = /^\/json\//;
app.all(driveJsonSection, (req, res) => 
{
    var path = render.getPath(req, driveJsonSection);

    let file_JSON = render.getJSON(path);


    if (typeof file_JSON === 'object') {
        log.create(`Requested path JSON loaded - Path: [${path}]`);
    }


    res.json(file_JSON);
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
    var path = render.getPath(req, streamSection);

    if (!fs.existsSync(path)) {
        log.create(`404 - Requested file not found - Mode: {Stream}, Path: [${path}]`);
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

app.listen(PORT, () => log.create(`Self-cloud-server listening on [${HOSTNAME}:${PORT}]!`));

// app.listen(80, () => {
//     log.create(`Listening to Secondary port [${HOSTNAME}:${80}]!`);
// })

// ################################### //
