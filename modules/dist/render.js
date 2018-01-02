'use strict';

const fs = require('fs');


function _render(SETTINGS, log)
{
    // * log.js module support
    if (log === undefined)
    {
        console.log('Log module is not supported.');

        log = {
            create: msg => console.log(msg)
        }
    }


    // Render HTML page.
    function _getPage(/* MODULES */)
    {
        let files = new Array();

        // 1. Get required files.
        files.push(fs.readFileSync('app/header.partial.html'));

        // 2. Get modules.
        let modules = Array.from(arguments);

        for (let i = 0; i < modules.length; i++)
            files.push(fs.readFileSync(`app/stat/${modules[i]}/index.html`));


        files.push(fs.readFileSync('app/footer.partial.html'));


        // 3. Join gethered files.
        let content;

        files = files.map(f => f.toString('utf-8'));
        
        content = files.join();

        return content;
    }


    function _getPath(req, SECTION_RegExp)
    {
        let path;

        let location = req.path.replace(SECTION_RegExp, '');

        // E1. Check if there's missing data in settings.
        let ROOT_PATH = SETTINGS.path.root;

        if (ROOT_PATH == undefined) {
            log.create(`[ROOT_PATH] is not specified - Module: <render.js: _getPath>`);
            throw null;
        }
        
        // 1. Decode filename that was URI encoded.
        path = ROOT_PATH + decodeURIComponent(location);
        path = path.replace('//', '/');

        return path;
    }

    function _getFileExt(path)
    {
        let file_ext;
        // 1. Remove the last sub-folder's path.
        file_ext = path.match(/\/[^/]+$/);

        if (file_ext === null)
            // 1-1. Incase of the path points a content of root dir.
            file_ext = file_ext.match(/[^/]+$/);

        if (file_ext === null) {
            // 1-E. Given path is not a valid file name.
            log.create(`Not a valid path - Module: <render.js: _getFileExt>, Path: [${path}]`);
            return 400;
        }
        file_ext = file_ext[0];

        // 2. Remove filename.
        file_ext = file_ext.match(/\.[^.]+$/);

        if (file_ext === null) {
            // 2-1. Incase of the file has no extension specified.
            file_ext = '';
        }
        else {
            file_ext = file_ext[0];
            file_ext = file_ext.replace('.', '');
        }

        return file_ext;
    }


    function _getFileName(path)
    {
        let file_name;

        // 1. Remove the last sub-folder's path.
        file_name = path.match(/\/[^/]+$/);


        if (file_name === null)
            // 1-1. Incase of the path points a content of root dir.
            file_name = file_name.match(/[^/]+$/);

        file_name = file_name[0];

        // 2. Remove extension.
        file_name = file_name.replace(_getFileExt(path), '');

        // 3. Remove remaining slash.
        file_name = file_name.replace('/', '');

        return file_name;
    }



    function _getFileType(path)
    {
        // 1. Incase of directory.
        if (path.match(/[^/]+\/$/) !== null)
            return 'folder';


        let extension = _getFileExt(path);

        if (typeof extension !== 'string') {
            // 1-E. Return the same error code we've got from `_getFileExt()`.
            log.create(`Failed to get type - Module: <render.js: _getFileType>, Path: [${path}]`);
            
            return extension;
        }

        let sup_types = SETTINGS.supported_media_types;

        for (let type in sup_types) {
            for (let i = 0; i < sup_types[type].length; i++)
                if (extension === sup_types[type][i])
                    return type;
        }

        return 'file';
    }


    // Get JSON data of files in specified directory.
    function _getJSON(path, id)
    {
        let Err = '';

        if (id !== undefined)
            Err += `User: [${id}]\t`;

        // E1. Check if path exists.
        if (!fs.existsSync(path))
        {
            Err += `Requested path not found - Module: <render.js: _getJSON>, Path: [${path}]`;

            log.create(Err);
            return 404;
        }

        // E2. Check if path is a directory.
        if (!fs.statSync(path).isDirectory())
        {
            Err += `Requested path is not a directory - Module: <render.js: _getJSON()>, Path: [${path}]`;

            log.create(Err);
            return 400;
        }


        let files = fs.readdirSync(path).map(f => {
            let _name = f;

            if (fs.statSync(path + f).isDirectory())
                _name += '/';
    
            return {
                name: _name,
                type: _getFileType(path + _name)
            };
        });

        return files;
    }


    return {
        getPage: _getPage,
        getPath: _getPath,
        getFileExt: _getFileExt,
        getFileName: _getFileName,
        getFileType: _getFileType,
        getJSON: _getJSON
    }
}


// ######## MODULE EXPORTS ######## //

module.exports = _render;