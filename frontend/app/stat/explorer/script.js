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
var explorer_currentPath = decodeURIComponent(location.pathname.replace('/drive/', '')),
    explorer_loadingPath;

var explorer_virtual_list = {
    folder: new Array(),
    file: new Array()
}

var isAudioPlayerSupported = true;

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

    console.log('current dir: ', explorer_currentPath);
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
            window.history.pushState('', 'DRIVE!', `/drive/${path}`);
            
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
                console.log(xhr.responseText);

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
        
        let oldItem = explorer_virtual_list[listType][index];
    
        source.node = oldItem.node;
        source.path = explorer_loadingPath + source.name;
    
        // write over an item in virtual list.
        explorer_virtual_list[listType][index] = source;
    
        // write over an node in list DOM.
        if (listType != 'folder') {
            source.node.setAttribute('type', source.type);
            
            if (source.type == 'audio' && isAudioPlayerSupported) {
                // MOVE THIS PART TO AUDIOPLAYER ********************************************* !!
                let isPlaylistAdded = false;
                source.node.setAttribute('playlist-added', isPlaylistAdded);
            } else {
                source.node.removeAttribute('playlist-added');
            }
        }
        
        source.node.setAttribute('path', source.path);
        source.node.setAttribute('secured', source.secured);

        source.node.querySelector('.title').innerHTML = source.name;

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

        let li = document.createElement('li');
        li.className = 'explorer-item';
        
        source.path = explorer_loadingPath + source.name;
        li.setAttribute('path', source.path);
        li.setAttribute('type', source.type);
        li.setAttribute('secured', source.secured);

        if (source.type == 'audio' && isAudioPlayerSupported) {
            // MOVE THIS PART TO AUDIOPLAYER ********************************************* !!
            let isPlaylistAdded = false;
            li.setAttribute('playlist-added', isPlaylistAdded);
        }

        li.innerHTML = `<button class="primary-button hitbox">
                            <svg height="24" viewBox="0 0 24 24" width="24">
                                <path d="M0 0h24v24H0z" fill="none"/>
                                
                                <path class="checkbox-outline" d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                                <path class="checkbox-checked" d="M10 17l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>

                                <path class="folder" d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
                                <path class="audio" d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>
                                <path class="file" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                            </svg>
                        </button>
                        <span class="title">${source.name}</span>
                        <button class="secondary-button hitbox">
                            <svg height="24" viewBox="0 0 24 24" width="24">
                                <path d="M0 0h24v24H0z" fill="none"/>
                                
                                <path class="playlist-add" d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/>
                                <path class="playlist-added" d="M14 10H2v2h12v-2zm0-4H2v2h12V6zM2 16h8v-2H2v2zm19.5-4.5L23 13l-6.99 7-4.51-4.5L13 14l3.01 3 5.49-5.5z"/>
                            </svg>
                        </button>`;

        li.addEventListener('click', explorer_listItem_onclickEl);

        source.node = li;

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
function explorer_listItem_onclickEl(evt) {
    let target = evt.currentTarget;

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
    }
}