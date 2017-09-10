'use strict';

function debug() {
    console.log(arguments);
}

const PORT = 3000;

const ROOT_PATH = '/Volumes/Hepheir/Database';

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

    // If user is not logged in, send sign in page.
    let isLogin = client;
    if (!isLogin) {
        renderPage('login');

    } else {
        let path = ROOT_PATH + req.params[0];

        fs.stat(path, (err, stats) => {
            if (err) {
                // If path does not exist, send error page.
                renderPage('error');

            } else {
                // Check if user has valid access level.
                let clientLevel = settings.getClientLevel(client),
                    pathLevel = settings.getPathLevel(path);

                if (clientLevel < pathLevel) {
                    renderPage('login');

                } else {                    
                    // Check whether requested path points a directory or a file.
                    if (stats.isDirectory()) {
                        renderPage('directory');

                    } else {
                        renderPage('file');
                        
                    }

                }

            }
        })
    }
    
    
    function renderPage(pageType) {
        res.send(pageType + '');
    }
    

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