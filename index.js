'use strict';

const PORT = 3000;

const ROOT_PATH = '/Volumes/Hepheir/Database';


const log = logHandler();

const settings = require('./settings/settings.js');
settings.setRootDirectory(ROOT_PATH);


// ################################### //
const express = require('express')
, fs = require('fs')
, handlebars = require('handlebars')
, cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());

app.get(/^(.*)$/, (req, res) => {
    let path = ROOT_PATH + req.params[0],
        pagetype;

    handlebars.source = {
        title: 'Hepheir-Self-Cloud-Server'
    };

    new Chain()
    .then((resolve, reject) => {
        // Check if user wants to logout.
        if ('logout' in req.query) {
            pagetype = 'logout';
            reject();

        }
    })
    .then((resolve, reject) => {
        // 1. Check path exists.
        let stat;
        try {
            stat = fs.statSync(path);

        } catch (err) {
            pagetype = 'error'
            reject();

            return;
        }
        resolve(stat);

    })
    .then((resolve, reject, stat) => {
        // 2. Check user has valid access level.
        let clientLevel, pathLevel;

        let isLogin = req.cookies.id;
        if (isLogin) {
            clientLevel = settings.getClientLevel(req.cookies.id)

        } else {
            clientLevel = 0;

        }
        pathLevel = settings.getPathLevel(path);

        if (clientLevel < pathLevel) {
            pagetype = 'login';
            reject();

        } else {
            resolve(stat);
            
        }
    })
    .then((resolve, reject, stat) => {
        // 3. Identify requested path is a directory.
        let isDirectory = stat.isDirectory();
        if (isDirectory) {
            pagetype = 'directory';

            handlebars.source.path = path;
            handlebars.source.files = new Array();

            let files = fs.readdirSync(path);
            files.map(f => {
                let source = {
                    file: f,
                    isDir: false
                };
                
                let isDirectory = false;
                try {
                    isDirectory = fs.statSync(`${path}${f}`).isDirectory();

                } catch(err) {
                    log.create(err.toString('utf-8'));
                    return;

                }

                if (isDirectory) {
                    source.file += '/';
                    source.isDir = true;
                }

                handlebars.source.files.push(source);
            })
            reject();
        }
    })
    .then((resolve, reject, stat) => {
        // ### Handler for 'download' and 'streaming' mode. ###
        if ('download' in req.query) {
            let content = fs.readFileSync(path);
            res.send(content);

            reject();
            return;
        }
        else if ('streaming' in req.query) {
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
            pagetype = undefined;
            reject();
            return;
        }

        resolve(stat);

    })
    // 4. Check is requested file a supported media type.
    .then((resolve, reject) => {
        let extension = path.match(/[^\/]*$/)[0].includes('.')
            ? path.match(/([^\.])*$/)[0].toLowerCase()
            : '(확장자가 없습니다)';
        
        handlebars.source.file = path.match(/[^\/]*$/)[0];

        resolve(extension);
    })
    .then((resolve, reject, extension) => {
        // AUDIO
        if (['mp3', 'ogg', 'wav'].includes(extension)) {
            if ('mp3' == extension) {
                handlebars.source.type = 'mpeg';

            } else {
                handlebars.source.type = extension;

            }
            
            pagetype = 'audio';
            reject();

        } else {
            resolve(extension);
        }
    })
    .then((resolve, reject, extension) => {
        // VIDEO
        if (['mp4', 'webm', 'ogv'].includes(extension)) {
            handlebars.source.type = extension;

            pagetype = 'video';
            reject();
        }
    })
    .then((resolve, reject, extension) => {
        // TEXT
        if ( 'text' in req.query || 'text' == extension) {

            handlebars.source.text = fs.readFileSync(path).toString('utf-8');

            pagetype = 'text';
            reject();
        }
        resolve(extension);
    })
    // File seems to be not supported.
    .then((resolve, reject, extension) => {
        pagetype = 'file';
        handlebars.source.extension = extension;
    })


    // create a log.
    let logMessage = `${req.ip} <${req.cookies.id}> ['${path}'] (${pagetype})`;
    log.create(logMessage);

    // 6. If user requested 'download' or 'streaming' mode,
    //    server doesnt have to render html page. ESCAPE!!!
    if (pagetype == undefined) {
        return;
    }

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
    log.create(`Self-cloud-server listening on port ${PORT}!`);
})

function logHandler() {
    let d = new Date(),
        lastestLog;
    return {
        create: (msg) => {
            let history = fs.readFileSync('log.txt');

            let newLog;
            if (lastestLog == msg) {
                newLog = '*';

            } else {
                lastestLog = msg;
                console.log(msg);

                newLog = `\n${d.toLocaleString()}: ${msg} `;
            }    
            fs.writeFileSync('log.txt', history + newLog);
        }
    }
}


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