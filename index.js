'use strict';

const HOSTNAME = 'localhost'
    , PORT = 3000;

// Mac: '/Volumes/Hepheir/Database'
// Win: 'G:/Database'
const ROOT_DIR = './ex_directory/';


// ################################### //
/* Custom Modules */
const log = require('./modules/log.js')
    , fsp = require('./modules/fsp.js');

/* Node Modules */
const express = require('express')
    , fs = require('fs')
    , handlebars = require('handlebars')
    , cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());
app.use(express.static('app'));

/* on Launch */
if (!fs.existsSync(ROOT_DIR)) {
    throw `\`${ROOT_DIR}\` not found.`;
}

function renderPage(page_type, handlebars_source) {
    if (!page_type) {
        return false;
    }

    let files = [
        fs.readFileSync('app/header.partial.html'),
        fs.readFileSync(`app/${page_type}/index.html`),
        fs.readFileSync('app/footer.partial.html')
    ];

    files = files.map(f => f.toString('utf-8'));
    files = files.join('');

    return handlebars.compile(files)(handlebars_source);
}

/* drive */
let driveSection = /^([^/]*)\/drive\/(.*)$/;
app.get(driveSection, (req, res) => {
    let path = req.params[1],
        source = new Object();

    let content = renderPage('directory', source);
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