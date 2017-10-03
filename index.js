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
app.use(express.static('app'));

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
let driveSection = /^([^/]*)\/drive\/(.*)$/;
app.get(driveSection, (req, res) => {
    // For building Front end
    let source = {

    };
    res.send(renderPage('drive', source));
    return;

    // Original
    let path = ROOT_PATH + req.params[1];
    req.source = new Object();

    log.create(`<${req.ip}> access to [${path}]`);

    if (!fs.existsSync(path)) {
        res.send(renderPage('error', req.source));
        return;
    }

    req.source.parent = path.match(/([^/]+)\/([^/]+)(\/$|$)/)[0].split('/')[0];
    req.source.current = path.match(/([^/]+)(\/$|$)/)[0].split('/')[0];

    let isDirectory = fs.statSync(path).isDirectory();
    if (isDirectory) {
        req.type = 'directory';

        let files;
        
        files = fs.readdirSync(path);
        files = files.map(file => {
            return {
                name: file,
                type: fileType(`${path}/${file}`),
                owner: '',
                level: 0
            }
        })
        // Sort directories to top.
        files.sort((a, b) => {return a.type !== 'directory'})

        req.source.files = files;
    } else {
        req.type = fileType(path);

        let file = {
            name: '',
            type: req.type
        }
    }

    let content = renderPage(req.type, req.source);
    res.send(content);
})

/* login */
let loginSection = /^([^/]*)\/login\/(.*)$/;
app.get(loginSection, (req, res) => {
    let path = req.params[1];

    let handlebars_source = {
        path: path
    }


    res.send(content);
})


/* download */
let downloadSection = /^([^/]*)\/download\/(.*)$/;
app.get(downloadSection, (req, res) => {
    res.send('download');
})

let streamSection = /^([^/]*)\/stream\/(.*)$/;
app.get(streamSection, (req, res) => {
    res.send('stream');
})

// Default
app.get(/^.*/, (req, res) => {
    res.send('<a href="./drive/">to Drive</a>');
})

app.post(/^.*/, (req, res) => {
    res.send();
})


app.listen(PORT, HOSTNAME, () => {
    log.create(`Self-cloud-server listening on [${HOSTNAME}:${PORT}]!`);
})

// ################################### //

/**
 * Create a html document.
 * 
 * @param {string} type 
 * @param {CompileOptions} source 
 * @return {HTMLDocument}
 */
function renderPage(type, source) {
    if (!type) {
        return false;
    }

    let files = [
        fs.readFileSync('app/header.partial.html'),
        fs.readFileSync(`app/${type}/index.html`),
        fs.readFileSync('app/footer.partial.html')
    ];

    files = files.map(f => f.toString('utf-8'));
    files = files.join('');

    return handlebars.compile(files)(source);
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
        return 'directory';
    }

    let extension = path.match(/([^.]*)$/)[0];

    for (let type in SUPPORTED_MEDIA_TYPES) {
        if (SUPPORTED_MEDIA_TYPES[type].includes(extension)) {
            return type;
        }
    }
    return 'file';
}