'use strict';

function debug() {
    console.log(arguments);
}

const PORT = 3000;

const ROOT_PATH = '..';

// Supported Media Types
const SUPPORTED_MEDIA_TYPES = {
    'audio': ['mp3', 'ogg', 'wav'],
    'video': ['mp4', 'webm', 'ogg'],
    'text' : ['txt'],
    'code' : ['c', 'cp', 'cpp', 'python', 'js']
};


const express = require('express')
    , fs = require('fs')
    , handlebars = require('handlebars')
    , cookieParser = require('cookie-parser');

const settings = require('./settings/settings.js');
settings.setRootDirectory(ROOT_PATH);

const app = express();
app.use(cookieParser());
app.use(express.static('ui'));

// This function responses to all routes with get method.
app.get(/^(.*)$/, (req, res) => {
    let path = ROOT_PATH + req.params[0],
        pagetype;

    handlebars.source = {};

    new Chain()
    .then((resolve, reject) => {
        // If user is not logged in, send sign in page.
        let isLogin = true;
        if (!isLogin) {
            pagetype = 'login';
            reject();
        }
    })
    .then((resolve, reject) => {
        // If path does not exist, send error page.
        let stats;
        try {
            stats = fs.statSync(path);

        } catch (err) {
            console.log(err);
            pagetype = 'error'
            reject();

            return;
        }
        resolve(stats);

    })
    .then((resolve, reject, stats) => {
        // Check if user has valid access level.
        let clientLevel = settings.getClientLevel(req.cookies.id),
            pathLevel = settings.getPathLevel(path);

        if (clientLevel < pathLevel) {
            pagetype = 'login';
            reject();
        } else {
            resolve(stats);
        }
    })
    .then((resolve, reject, stats) => {
        // Check whether requested path points a directory or a file.
        let isDirectory = stats.isDirectory();
        if (isDirectory) {
            pagetype = 'directory';

            handlebars.source.files = [{file: '../'}];

            let files = fs.readdirSync(path);
            files.map(f => handlebars.source.files.push(
                {
                    file: f
                }
            ));
            reject();
        }
    })
    .then((resolve, reject) => {
        // If path points a file, check if requested file is supported media type.
        let extension = path.match(/[^\.]*$/)[0];

        for (let mediaType in SUPPORTED_MEDIA_TYPES) {
            if (SUPPORTED_MEDIA_TYPES[mediaType].includes(extension)) {
                pagetype = mediaType;
                reject();
            }
        }
    })
    .then((resolve, reject) => {
        pagetype = 'file';

    })

    console.log(path, pagetype, handlebars.source)

    let files = [
        fs.readFileSync('ui/header.partial.html'),
        fs.readFileSync(`ui/${pagetype}/index.html`),
        fs.readFileSync('ui/footer.partial.html')
    ];

    Promise.all(files)
    .then(files => files.map(f => f.toString('utf-8')))
    .then(files => files = files.join(''))
    .then(files => {
        const content = handlebars.compile(files)(handlebars.source);
        
        res.send(content);
    })
})

app.listen(PORT, () => {
    console.log(`Self-cloud-server listening on port ${PORT}!`);
})


class Chain {
    constructor() {
        this.then = this.then.bind(this);
        this.proceed = this.proceed.bind(this);
        this.stop = this.stop.bind(this);

        this.isPending = true;
        this.pass = undefined;

        this.then();
    }

    then(executor) {
        if (this.isPending && executor) {
            let that = this;
            executor.apply(this, [that.proceed, that.stop, that.pass]);
        }

        return {then: this.then};
    }

    proceed(value) {
        this.pass = value;
    }

    stop() {
        this.isPending = false;
    }
}