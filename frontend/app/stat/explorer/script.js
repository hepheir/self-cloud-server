var timer = (function() {
    let t;
    return {
        start: msg => {
            console.log(msg);
            t = Date.now();
        },
        end: msg => {
            console.log(`${msg}\ntook ${Date.now() - t} ms.`);
        }
    }
})()



/**
 * if `val` is `undefined`, removes `mode` attribute from `document.body`
 * 
 * @param {String} mode 
 * @param {String} val 
 */
function setMode(mode, val) {
    if (val === undefined) {
        document.body.removeAttribute(mode);
        return;
    }
    document.body.setAttribute(mode, val);
}


setMode('root', 'false');
setMode('select-mode', 'false');
setMode('selected-items', '0');

var EXPLORER_ITEM_TEMPLATE;
function loadExplorerItemTemplate() {

    timer.start('loading template...');

    return new Promise((resolve, reject) => {

        let xhr = new XMLHttpRequest();

        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                timer.end('finished loading template...');
                resolve(xhr.responseText);
            }
        }
        xhr.open('get', '/stat/explorer/item.html', true);
        xhr.send();
    })
    .then(template => {
        EXPLORER_ITEM_TEMPLATE = template;

        explorerOpenDir(location.pathname)
        .then(files => {
            timer.start('start building DOM...');

            DOM_folder_list.innerHTML = '';
            DOM_file_list.innerHTML = '';

            return files;
        })
        .then(files => files.map(f => {
            f.playlistAdded = false;
            
            let content = compileExplorerItemTemplate(f);

            if (f.type == 'folder') {
                DOM_folder_list.innerHTML += content;
            } else {
                DOM_file_list.innerHTML += content;
            }
        }))
        .then(() => {
            timer.end('finished building DOM.');
        })

    })
}
loadExplorerItemTemplate();

/**
 * compile the template using `handlebars`-like syntax
 * @param {Object} source 
 */
function compileExplorerItemTemplate(source) {
    let content = EXPLORER_ITEM_TEMPLATE;

    for (let key in source) {
        content = content.replace(`{{${key}}}`, source[key]);
    }

    return content;
}


const DOM_folder_list = document.getElementById('explorer-list__folder')
    , DOM_file_list = document.getElementById('explorer-list__file');


/**
 * Request json data of the path, returns Promise object.
 * @param {String} path 
 * @return {Promise}
 */
function explorerOpenDir(path) {
    timer.start('start loading...');
    
    let xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                timer.end('finished loading.');

                let files = JSON.parse(xhr.responseText);
                resolve(files);
            }
        }
        xhr.open('get', path.replace('/drive/', '/json/'), true);
        xhr.send();
    });
}
