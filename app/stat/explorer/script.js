'use strict';

var explorer = {
    list: {
        folder: new Array(),
        file: new Array()
    },
    DOM: {
        list: {
            folder: document.getElementById('explorer-list__folder'),
            file:   document.getElementById('explorer-list__file')
        }
    },
    currentPath: decodeURIComponent(location.pathname.replace('/drive/', '/')),
    loadingPath: undefined
}




explorer.addListItem = function(file) {
    return new Promise((resolve, reject) => {
        let isAudioPlayerSupported = false // typeof audio !== undefined;
        let isFolder = file.type == 'folder';
        
        let secondaryButtonIconType;
        if (isAudioPlayerSupported) {
            if (file.playlist_added) {
                secondaryButtonIconType = 'playlist-added';
            } else {
                secondaryButtonIconType = 'playlist-add';
            }

        } else {
            secondaryButtonIconType = 'vert-more';
        }

        // create an array of child DOMs for li.
        let li_childs = [
            createElementShortCut('button', {class: 'primary-button hitbox'}, [createElementShortCut('img', {class: 'icon', src: `${ICON_PATH + file.type}.svg`}, undefined)]),
            createElementShortCut('span'  , {class: 'title'}, [document.createTextNode(file.name)]),
            createElementShortCut('button', {class: 'secondary-button hitbox'}, [createElementShortCut('img', {class: 'icon', src: `${ICON_PATH + secondaryButtonIconType}.svg`}, undefined)])
        ]
        
        // take an action when user clicks on filename.
        li_childs[1].addEventListener('click', explorer_listItem_title_onclickEl);
        li_childs[2].addEventListener('click', explorer_listItem_secondaryBtn_onclickEl);


        // the ITEM!
        let li = createElementShortCut('li', {
            class: 'explorer-item',
            path: file.path,
            type: file.type,
            secured: file.secured
        }, li_childs);

        if (isAudioPlayerSupported) {
            li.setAttribute('playlist-added', file.playlist_added);
        }

        file.node = li;


        // append item to DOM list & Object Virtual list
        if (isFolder) {
            explorer.DOM.list.folder.appendChild(li);
            explorer.list.folder.push(file);

        } else {
            explorer.DOM.list.file.appendChild(li);
            explorer.list.file.push(file);
        }
        
        resolve(file);
    })
}

explorer.readDir = function(path) {
    // 1. Request a directory data using AJAX
    let xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                resolve(xhr.response);
            }
        }
        xhr.open('get', `/json${path}`, true);
        xhr.responseType = 'json';
        xhr.send();
    })
    // 2. Check whether we received what we want!
    .then(response => {
        if (Array.isArray(response)) {
            return response;

        } else {
            console.log('Access Denied or Not found.');
            throw 'Error'
        }
    })
    // 3. Parse received data.
    .then(response => {
        let list = {
            folder: new Array(),
            file: new Array()
        }

        for (let i = 0; i < response.length; i++) {
            let file = response[i];

            let source = {
                name: file.name,
                type: file.type,
                secured: file.secured,
                path: explorer.currentPath + file.name,
                node: undefined
            }

            if (file.type == 'folder') {
                list.folder.push(source);
            } else {
                list.file.push(source);
            }
        }
        
        return list;
    })
}

explorer.openDir = function(path) {
    explorer.loadingPath = path;
    return explorer.readDir(path)
    // 1. Caculates how many DOMs should be added/removed.
    .then(list => {

    })
}

var isAudioPlayerSupported = false;

// Global Constants
const explorer_header_primaryBtn_DOM = document.getElementById('explorer-header__primary-button')
    , explorer_header_title_DOM = document.getElementById('explorer-header__title');


document.body.setAttribute('root', 'false');
document.body.setAttribute('select-mode', 'false');
document.body.setAttribute('selected-items', '0');


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


                let playlist = new Array();
                if (isAudioPlayerSupported) {

                    playlist = audio_playlist; // From audio-player!
                    
                    let primaryFilter = explorer_loadingPath.replace('/drive/', '/');
                    playlist = playlist.filter(src => {
                        if (!src.startsWith(primaryFilter)) {
                            return false;
                        }
                        
                        return !src.replace(primaryFilter, '').includes('/');
                    });
                }
                
                // Replaces & adds list items.
                for (let i = 0; i < new_list.length; i++) {
                    let source = new_list[i];

                    source.playlist_added = undefined;
                    if (isAudioPlayerSupported && !source.secured && source.type == 'audio') {
                        source.playlist_added = playlist.includes(explorer_loadingPath + source.name);
                    }

                    if (old_list[i]) {
                        explorer_asyncWriteOverListItem(i, source);
                    } else {
                        explorer_asyncAddListItem(source);
                    }

                    new_list[i] = source;
                }
            }
        })
        .then(() => {
            // Update location
            window.history.pushState('', 'DRIVE!', `/drive${explorer_loadingPath}`);
            
            explorer_currentPath = explorer_loadingPath;
            console.log(path);

            if (path == '/') {
                explorer_header_title_DOM.innerHTML = 'Drive';
                document.body.setAttribute('root', 'true');
            } else {
                explorer_header_title_DOM.innerHTML = explorer_currentPath.match(/[^/]+\/$/)[0].replace('/', '');
                document.body.setAttribute('root', 'false');
            }
        })
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
        if (listType != 'folder') {
            source.node.setAttribute('type', source.type);
            source.node.querySelector('.primary-button img').src = `/stat/icon/${source.type}.svg`;


            let secondary_img_src;
            if (source.playlist_added !== undefined) { // if Audio Player is supported, `source.added` should be a Boolean value.

                if (source.playlist_added) {
                    secondary_img_src = '/stat/icon/playlist-added.svg';
                } else {
                    secondary_img_src = '/stat/icon/playlist-add.svg';
                }
                source.node.setAttribute('playlist-added', source.playlist_added);

            } else {
                secondary_img_src = '/stat/icon/vert-more.svg';
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
        if (source.playlist_added !== undefined) { // if Audio Player is supported, `source.playlist_added` should be a Boolean value.

            if (source.playlist_added) {
                secondary_img_src = '/stat/icon/playlist-added.svg';
            } else {
                secondary_img_src = '/stat/icon/playlist-add.svg';
            }

        } else {
            secondary_img_src = '/stat/icon/vert-more.svg';
        }

        // create an array of child DOMs for li.
        let li_childs = [
            explorer_createQuickDOM('button', {class: 'primary-button hitbox'}, [explorer_createQuickDOM('img', {class: 'icon', src: `/stat/icon/${source.type}.svg`}, undefined)]),
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

        if (source.playlist_added !== undefined) {
            li.setAttribute('playlist-added', source.playlist_added);
        }

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


// list item onClick events
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
        if (confirm(`download file: \n[${file.path.match(/[^/]+$/)[0]}]?`)) {
            window.open(`/stream${file.path}`);
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

    if (isAudioPlayerSupported && !file.secured && file.type == 'audio') {
        if (target.getAttribute('playlist-added') == 'true') {
            
            audio_removeSongFromPlaylist(file.path);
            target.querySelector('.secondary-button img').src = '/stat/icon/playlist-add.svg';
            target.setAttribute('playlist-added', 'false');

        } else {
            audio_queueSongToPlaylist(file.path);
            target.querySelector('.secondary-button img').src = '/stat/icon/playlist-added.svg';
            target.setAttribute('playlist-added', 'true');
        }

    } else {
        // Info about folder/file
        console.log('info!');
    }
}

