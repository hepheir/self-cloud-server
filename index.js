'use strict';

const CONFIG_PATH = './config.yaml';

// ################################### //

const fs = require('fs');
const path = require('path');
const express = require('express');
const yaml = require('js-yaml');

// ################################### //

function readConfig(config_file) {
    var _config = {
        'host': 'localhost',
        'port': 80,
        'root': '/'
    };
    try {
        _config = yaml.safeLoad(fs.readFileSync(config_file, 'utf-8'));
    } catch (e) {
        fs.writeFileSync(config_file, yaml.safeDump(_config));
    }
    return _config;
}


function readDirRecursive(dirpath, depth=1) {
    let data = {};
    for (let fileBasename of fs.readdirSync(dirpath)) {
        let file = path.resolve(dirpath, fileBasename);
        let stats = fs.lstatSync(file);
        let filedata = {
            'path': file,
            'content-type': stats.isDirectory() ? 'dir' : 'file'
        };
        if (stats.isDirectory() && depth > 0) {
            filedata['content'] = readDirRecursive(file, depth-1);
        }
        data[fileBasename] = filedata;
    }
    return data;
}

// ################################### //

const config = readConfig(CONFIG_PATH);

const app = express();

app.use(express.static('app'));
app.get('/*', (req, res) => {
    if (req.params) {
        // Load UI
        let _path = path.resolve(config.root, req.params[0]);

    }
    else if (req.query.folder) {
        let _path = path.resolve(config.root, req.query.folder);
        let _content = readDirRecursive(_path, 3);
        res.send(_content);
    }
    else {
        let _path = config.root;
    }
    res.send('hi');
});

app.listen(config.port, () => {
    console.log(`Self-cloud-server listening on ${config.host}:${config.port}!`);
});
