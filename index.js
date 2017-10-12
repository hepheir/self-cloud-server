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
app.use(express.static('app'));


// LOBBY
app.all('/', (req, res) => {
    res.send('<script>location.replace("./drive/");</script>');
})

let driveSection = /^\/drive\//;
app.all(driveSection, (req, res) => {
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

let playlistSection = /^\/playlist\//;
app.all(playlistSection, (req, res) => {
    var path = getPath(req.path.replace(playlistSection, ''));

    let playlist = [
        '/1) Music/We Are Number One Remix but by The Living Tombstone (Lazytown).mp3',
        '/1) Music/11) 멜론 구매곡/17-09 D/TK from Ling tosite sigure-03-Unravel (Acoustic Version).mp3',
        '/1) Music/11) 멜론 구매곡/17-09 D/UVERworld-05-儚くも永久のカナシ _ Hakanakumo Towa No Kanashi (덧없고 영원한 슬픔).mp3'
    ];

    let content = playlist;
    res.setHeader('Content-Type', 'application/json');
    res.send(content);
})

let streamSection = /^\/stream\//;
app.all(streamSection, (req, res) => {
    var path = getPath(req.path.replace(streamSection, ''));

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

let downloadSection = /^\/download\//;
app.all(downloadSection, (req, res) => {
    var path = getPath(req.path.replace(streamSection, ''));

    if (!fs.existsSync(path)) {
        res.send(null);
        return;
    } else {
        let content = fs.readFileSync(path);
        res.send(content);
    }
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