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

    let files = render.readDir(path);


    if (!Array.isArray(files))
    {
        log.create(`Failed to load requested path - Path: [${path}]`);
    
        res.send(files); // Error Code.
        return;
    }

    let json = files.map(f => {
        return {
            name: render.getFileName(f),
            type: render.getFileType(f),
            path: path + f
        }
    })

    log.create(`Requested path JSON loaded - Path: [${path}]`);

    res.json(json);
})


let streamSection = /^\/stream\//;
app.all(streamSection, (req, res) => {
    var path = render.getPath(req, streamSection);

    if (!fs.existsSync(path)) {
        log.create(`Requested file not found - Mode: {Stream}, Path: [${path}]`);
        res.send(null);
        return;
    }

    let file_type = render.getFileType(path),
        file_ext  = render.getFileExt(path);

    let contentType = `${file_type}/${file_ext}`;


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

    log.create(`Requested file streamed - Mode: {Stream}, Path: [${path}]`);
})


// ################################### //

// Launch Server!

app.listen(PORT, () => log.create(`Self-cloud-server listening on [${HOSTNAME}:${PORT}]!`));

// app.listen(80, () => {
//     log.create(`Listening to Secondary port [${HOSTNAME}:${80}]!`);
// })

// ################################### //
