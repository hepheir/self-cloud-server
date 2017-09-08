'use strict';

const PORT = 3000;

const ROOT_PATH = 'G:\Database'
    , CENSORED_PATH = ['G:\Database\7) Collection\방주']
    , MEMBER = ['password12'];

const express = require('express')
    , fs = require('fs')
    , handlebars = require('handlebars')
    , cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());
app.use(express.static('ui'));

// This function responses to all routes with get method.
app.get(/.*/, (req, res) => {
    let pageType;

    // If user is not logged in, send sign in page.
    let isLogin = true;
    if (!isLogin) {
        pageType = 'login';

    } else {
        let path = ROOT_PATH + req.params[0];

        fs.stat(path, (err, stats) => {
            if (err) {
                // If path does not exists, send error page.
                pageType = 'error';

            } else {
                //  user access level
                pageType = stats.isDirectory() ?
                    'directory' :
                    'file';
            }
        })
    }


    let files = [
        fs.readFileSync('ui/header.partial.html'),
        fs.readFileSync(`ui/${pageType}/index.html`),
        fs.readFileSync('ui/footer.partial.html')
    ];

    Promise.all(files)
    .then(files => files.map(f => f.toString('utf-8')))
    .then(files => files = files.join(''))
    .then(files => handlebars.compile(files)())
    .then(files => {
        const content = files;

        res.send(content);
    })
})

app.listen(PORT, () => {
    console.log(`Self-cloud-server listening on port ${PORT}!`);
})