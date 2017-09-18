'use strict';

function debug() {
    console.log(arguments);
}

const PORT = 3000;

const ROOT_PATH = '/Volumes/Hepheir/Database';

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
    let client = req.cookies.id;

    var pageType;

    // If user is not logged in, send sign in page.
    var isLogin = client;
    if (!isLogin) {
        pageType = 'login';

    } else {
        var path = ROOT_PATH + req.params[0];

        fs.stat(path, (err, stats) => {
            if (err) {
                // If path does not exist, send error page.
                pageType = 'error';

            } else {
                // Check if user has valid access level.
                let clientLevel = settings.getClientLevel(client),
                    pathLevel = settings.getPathLevel(path);

                if (clientLevel < pathLevel) {
                    pageType = 'login';

                } else {                    
                    // Check whether requested path points a directory or a file.
                    if (stats.isDirectory()) {
                        pageType = 'directory';

                    } else {
                        // If path points a file, check if requested file is supported media type.
                        let extension = path.match(/[^\.]*$/)[0];
                        console.log(extension);

                        for (let mediaType in SUPPORTED_MEDIA_TYPES) {
                            if (SUPPORTED_MEDIA_TYPES[mediaType].includes(extension)) {
                                pageType = mediaType;
                            }
                        }

                        if (!pageType) {
                            pageType = 'file';
                        }
                       
                    }

                }

            }
        })
    }

    res.send();

    

    // let files = [
    //     fs.readFileSync('ui/header.partial.html'),
    //     fs.readFileSync(`ui/${pageType}/index.html`),
    //     fs.readFileSync('ui/footer.partial.html')
    // ];

    // Promise.all(files)
    // .then(files => files.map(f => f.toString('utf-8')))
    // .then(files => files = files.join(''))
    // .then(files => handlebars.compile(files)())
    // .then(files => {
    //     const content = files;

    //     res.send(content);
    // })
})

app.listen(PORT, () => {
    console.log(`Self-cloud-server listening on port ${PORT}!`);
})