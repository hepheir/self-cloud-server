var timer = (function() {
    let t;
    return {
        start: msg => {
            console.log(msg);
            t = Date.now();
        },
        end: msg => console.log(`${msg}\ntook ${Date.now() - t} ms.`)
}})()


// Global Variables

/**
 * uses decoded URI string.
 */
var explorer_currentPath = decodeURIComponent(location.pathname.replace('/drive/', '/')),
    explorer_loadingPath;

var explorer_virtual_list = {
    folder: new Array(),
    file: new Array()
}

var isAudioPlayerSupported = false;

// Global Constants
const explorer_list_DOM = {
    folder: document.getElementById('explorer-list__folder'),
    file:   document.getElementById('explorer-list__file')
}
const explorer_header_primaryBtn_DOM = document.getElementById('explorer-header__primary-button')
    , explorer_header_title_DOM = document.getElementById('explorer-header__title');


document.body.setAttribute('root', 'false');
document.body.setAttribute('select-mode', 'false');
document.body.setAttribute('selected-items', '0');

explorer_asyncOpenDir(explorer_currentPath);


// Header : Arrow Back Button
explorer_header_primaryBtn_DOM.addEventListener('click', evt => {
    if (document.body.getAttribute('root') == 'false') {
        let path = explorer_currentPath.replace(/[^/]+\/$/, '');
        explorer_asyncOpenDir(path);
    }
})


// Global Functions

/**
 * path : encoded URI String.
 * @param {String} path 
 */
function explorer_asyncOpenDir(path) {
    explorer_loadingPath = decodeURIComponent(path);
    console.log('now opening dir: ', explorer_loadingPath);

    return explorer_asyncReadDir(path)
        .then(files => {
            let list = {
                folder: new Array(),
                file:   new Array()
            };

            files.map(f => {
                if (f.type == 'folder') {
                    list.folder.push(f);
                } else {
                    list.file.push(f);
                }
            });

            return list;
        })
        .then(list => {
            for (let listType in list) {
                let new_list = list[listType],
                    old_list = explorer_virtual_list[listType];

                // Removes overflowing items.
                if (old_list.length > new_list.length) {
                    for (let i = old_list.length - 1; i >= new_list.length; i--) {
                        explorer_list_DOM[listType].removeChild(old_list[i].node);
                        old_list.pop();
                    }
                    explorer_virtual_list[listType] = old_list;
                }
                
                // Replaces & adds list items.
                for (let i = 0; i < new_list.length; i++) {
                    if (old_list[i]) {
                        explorer_asyncWriteOverListItem(i, new_list[i]);
                    } else {
                        explorer_asyncAddListItem(new_list[i]);
                    }
                }
            }
        })
        .then(() => {
            // Update location
            window.history.pushState('', 'DRIVE!', `/drive${explorer_loadingPath}`);
            
            explorer_currentPath = explorer_loadingPath;

            if (path == '') {
                explorer_header_title_DOM.innerHTML = 'Drive';
                document.body.setAttribute('root', 'true');
            } else {
                explorer_header_title_DOM.innerHTML = explorer_currentPath.match(/[^/]+\/$/)[0].replace('/', '');
                document.body.setAttribute('root', 'false');
            }
        })
}



/**
 * Request json data of the path, returns `Promise` object: which passes files `json` data.
 * @param {String} path 
 * @return {Promise}
 */
function explorer_asyncReadDir(path) {
    let xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                if (xhr.responseText) {
                    let files = JSON.parse(xhr.responseText);
                    resolve(files);
                } else {
                    explorer_header_title_DOM.innerHTML = 'Access Denied or Not found.';
                    reject();
                }
                
            }
        }
        xhr.open('get', `/json/${path}`, true);
        xhr.send();
    });
}

/**
 * Write over an existing list item Asynchronously.
 * 
 * source required key/values:
 * 
 *      source = {
 *          name: 'filename',
 *          type: 'filetype',
 *          secured: 'boolean'
 *      }
 * @param {Number} index
 * @param {Object} source
 * @return {Promise}
 */
function explorer_asyncWriteOverListItem(index, source) {
    return new Promise((resolve, reject) => {
        let listType = source.type == 'folder' ? 'folder' : 'file';
        
        let legacy = explorer_virtual_list[listType][index];
    
        source.node = legacy.node;
        source.path = explorer_loadingPath + source.name;
    
        // write over an item in virtual list.
        explorer_virtual_list[listType][index] = source;
    
        // write over an node in list DOM.
        source.node.setAttribute('path', source.path);
        source.node.setAttribute('secured', source.secured);
        source.node.querySelector('.title').innerHTML = source.name;

        // write over detailed parts if type doesn't match.
        if (listType != 'folder' && legacy.type != source.type) {
            source.node.setAttribute('type', source.type);
            source.node.querySelector('.primary-button img').src = `/stat/explorer/icon/${source.type}.svg`;


            let secondary_img_src;
            if (source.type == 'audio' && isAudioPlayerSupported && !source.secured) {
                secondary_img_src = '/stat/explorer/icon/playlist-add.svg';

                // MOVE THIS PART TO AUDIOPLAYER ********************************************* !!
                let isPlaylistAdded = false;
                source.node.setAttribute('playlist-added', isPlaylistAdded);


            } else {
                secondary_img_src = '/stat/explorer/icon/vert-more.svg';

                source.node.removeAttribute('playlist-added');
            }

            source.node.querySelector('.secondary-button img').src = secondary_img_src;
        }
        


        resolve(source);
    })
}

/**
 * Create & add item Asynchronously.
 * 
 * source required key/values:
 * 
 *      source = {
 *          name: 'filename',
 *          type: 'filetype',
 *          secured: 'boolean'
 *      }
 * @param {Object} source
 * @return {Promise}
 */
function explorer_asyncAddListItem(source) {
    return new Promise((resolve, reject) => {

        source.path = explorer_loadingPath + source.name;

        let secondary_img_src;
        if (source.type == 'audio' && isAudioPlayerSupported) {
            secondary_img_src = '/stat/explorer/icon/playlist-add.svg';
        } else {
            secondary_img_src = '/stat/explorer/icon/vert-more.svg';
        }

        // create an array of child DOMs for li.
        let li_childs = [
            explorer_createQuickDOM('button', {class: 'primary-button hitbox'}, [explorer_createQuickDOM('img', {class: 'icon', src: `/stat/explorer/icon/${source.type}.svg`}, undefined)]),
            explorer_createQuickDOM('span'  , {class: 'title'}, [document.createTextNode(source.name)]),
            explorer_createQuickDOM('button', {class: 'secondary-button hitbox'}, [explorer_createQuickDOM('img', {class: 'icon', src: secondary_img_src}, undefined)])
        ]
        
        // take an action when user clicks on filename.
        li_childs[1].addEventListener('click', explorer_listItem_title_onclickEl);
        li_childs[2].addEventListener('click', explorer_listItem_secondaryBtn_onclickEl);


        // the ITEM!
        let li = explorer_createQuickDOM('li', {
            class: 'explorer-item',
            path: source.path,
            type: source.type,
            secured: source.secured
        }, li_childs);

        source.node = li;
        


        if (source.type == 'audio' && isAudioPlayerSupported && !source.secured) {
            // MOVE THIS PART TO AUDIOPLAYER ********************************************* !!
            let isPlaylistAdded = false;
            li.setAttribute('playlist-added', isPlaylistAdded);
        }


        // append item to DOM list & Object Virtual list
        if (source.type == 'folder') {
            explorer_list_DOM.folder.appendChild(li);
            explorer_virtual_list.folder.push(source);

        } else {
            explorer_list_DOM.file.appendChild(li);
            explorer_virtual_list.file.push(source);
        }
        
        resolve(source);
    })
}
function explorer_listItem_title_onclickEl(evt) {
    let target = evt.currentTarget.parentNode;

    let file = {
        type: target.getAttribute('type'),
        path: target.getAttribute('path'),
        secured: target.getAttribute('secured') == 'true'
    }

    if (file.secured) {
        console.log(`You cannot access to [${file.path}]`);
        return;
    }

    if (file.type == 'folder') {
        // open dir.
        explorer_asyncOpenDir(file.path);
    } else {
        // open file.
        if (confirm(`download file: \n[${file.path}]?`)) {
            window.open(`/stream/${file.path}`);
        }
    }
}
function explorer_listItem_secondaryBtn_onclickEl(evt) {
    let target = evt.currentTarget.parentNode;
    
    let file = {
        type: target.getAttribute('type'),
        path: target.getAttribute('path'),
        secured: target.getAttribute('secured') == 'true'
    }

    if (!file.secured && file.type == 'audio' && isAudioPlayerSupported) {
        audio_queueSong(file.path);

    } else {
        // Info about folder/file
        console.log('info!');
    }
}


/**
 * 
 * @param {String} tagName
 * @param {[Node]} childNodes
 * @param {Object} attributes
 * @return {HTMLElement}
 */
function explorer_createQuickDOM(tagName, attributes, childNodes) {
    let node = document.createElement(tagName);

    for (let key in attributes) {
        let val = attributes[key];
        if (key == 'id') {
            node.id = val;
            continue;

        } else if (key == 'class') {
            node.className = val;
            continue;
        }
        node.setAttribute(key, val);
    }

    if (childNodes) {
        childNodes.map(cn => {
            node.appendChild(cn);
        })
    }
    

    return node;
}