'use strict';

var explorer = {
    list: {
        folder: new Array(), // # Used if `explorer.option.folderToTop` is `true`.
        file: new Array(),

        node: {
            folder: document.getElementById('explorer-list__folder'),  // Used if `explorer.option.folderToTop` is `true`.
            file:   document.getElementById('explorer-list__file')
        },

        rendered: {
            folder: 0, // # Used if `explorer.option.folderToTop` is `true`.
            file: 0
        },

        parse: undefined, // Function
        createNodes: undefined // Function
    },

    currentPath: decodeURIComponent(location.pathname.replace('/drive/', '/')),
    loadingPath: undefined,

    readDir: undefined, // Function
    openDir: undefined, // Function

    option: {
        folderToTop: true,
        maxRender: {
            folder: undefined, // # Used if `explorer.option.folderToTop` is `true`.
            file: 64,
        },
        isSelectMode: false
    }
}

explorer.list.parse = function(list) {
    let path = explorer.loadingPath === undefined ? explorer.currentPath : explorer.loadingPath;

    list = list.map(filedata => {
        return {
            name: filedata.name,
            type: filedata.type,
            secured: filedata.secured,
            path: path + filedata.name,
            node: undefined,
    
            title: {
                node: undefined,
                currentEl: new Object()
            },
            primaryButton: {
                node: undefined,
                currentEl: new Object(),
                icon: undefined
            },
            secondaryButton: {
                node: undefined,
                currentEl: new Object(),
                icon: undefined
            }
        }
    });

    let parsedList = {
        folder: new Array(),
        file: new Array()
    };

    // If `folderToTop` option is turned on, let's categorize the list!
    if (explorer.option.folderToTop) {
        list.forEach(filedata => {
            if (filedata.type == 'folder') {
                parsedList.folder.push(filedata);
            } else {
                parsedList.file.push(filedata);
            }
        });
    // In other wise, we are using `explorer.list.file` only.
    } else {
        parsedList.file = list;
    }

    return parsedList;
}

explorer.list.createNodes = function(filedata) {
    return new Promise((resolve, reject) => {
    // Title

        filedata.title.node = createElementShortCut(
            'span', {class: 'title'},
            [document.createTextNode(filedata.name)]
        );

        // Add Event listner
        let event = 'click',
            callback = evt => {
                let li = evt.currentTarget.parentNode;

                let filedata = {
                    type: li.getAttribute('type'),
                    path: li.getAttribute('path')
                };

                if (filedata.type == 'folder') {
                    explorer.openDir(filedata.path);
                }
            };

        filedata.title.node.addEventListener(event, callback);
        filedata.title.currentEl[event] = callback;


    // Button Icons

        filedata.primaryButton.icon = createElementShortCut(
            'img', {class: 'icon', src: `${ICON_PATH + filedata.type}.svg`},
            undefined
        );

        filedata.secondaryButton.icon = createElementShortCut(
            'img', {class: 'icon', src: `${ICON_PATH}vert-more.svg`},
            undefined
        );


    // Button Nodes

        filedata.primaryButton.node = createElementShortCut(
            'button', {class: 'primary-button hitbox'},
            [filedata.primaryButton.icon]
        );
        
        filedata.secondaryButton.node = createElementShortCut(
            'button', {class: 'secondary-button hitbox'},
            [filedata.secondaryButton.icon]
        );

    // li Element

        filedata.node = createElementShortCut(
            'li', {
                class: 'explorer-item',
                type: filedata.type,
                secured: filedata.secured,
                path: filedata.path
            },
            [
                filedata.primaryButton.node,
                filedata.title.node,
                filedata.secondaryButton.node
            ]);

        resolve(filedata);
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

        path = path.split('/');
        path = path.map(string => encodeURIComponent(string));
        path = path.join('/');

        xhr.open('get', `/json${path}`, true);
        xhr.responseType = 'json';
        xhr.send();
    })
    // 2. Check whether we received what we want!
    .then(response => {
        if (Array.isArray(response)) {
            return response;

        } else {
            console.log('Access Denied or Not found.', path);
            throw 'Error'
        }
    })
}

explorer.openDir = function(path) {
    explorer.loadingPath = path;
    
    // 1. Request directory data to server.
    return explorer.readDir(path)
    .catch(err => {
        console.log('cancel openDir.');
        explorer.loadingPath = undefined;

        throw err;
    })
    
    // 2. Parse list.
    .then(list => explorer.list.parse(list), err => console.log('Skip parsing list', err))

    // 3. Apply parsed list.
    .then(list => {
        for (let type in list) {
            let listDOM = explorer.list.node[type];

            let currentList = explorer.list[type],
                loadingList = list[type];

            let maxRender = explorer.option.maxRender[type];

            if (maxRender === undefined) {
                maxRender = 10000;
            }

            let i;
            for (i = 0; i < maxRender; i++) {

                let current = currentList[i],
                    loading = loadingList[i];

            // 3-1. Re-use existing nodes to reduce decrease of perfomance caused by building CSSDOMs.
                if (current !== undefined && loading !== undefined) {
                    // 3-1-1. Change icon type!
                    if (current.type != loading.type) {
                        current.type = loading.type;
                        current.node.setAttribute('type', loading.type);

                        current.primaryButton.icon.src = `${ICON_PATH + loading.type}.svg`;
                    }

                    // 3-1-2. Write over file name.
                    current.name = loading.name;
                    current.title.node.innerHTML = loading.name;

                    // 3-1-3. Write over file path.
                    current.path = loading.path;
                    current.node.setAttribute('path', loading.path);

                    // 3-1-4. is Secured?
                    current.secured = loading.secured;
                    current.node.setAttribute('secured', loading.secured);

                    // 3-1-5. Save changes.
                    loadingList[i] = current;

                }
            // 3-2. Remove overflowing nodes.
                else if (current !== undefined && loading === undefined) {

                    listDOM.removeChild(current.node);
                }
            // 3-3. Create nodes. (Asynchronous using Promise)
                else if (current === undefined && loading !== undefined) {
                    let filedata = loadingList[i];
                    filedata.index = i;
    
                    explorer.list.createNodes(filedata)
                    .then(filedata => {
                        let i = filedata.index,
                            type = filedata.type == 'folder' ? 'folder' : 'file';
                            
                        delete filedata.index;
                        
    
                        listDOM.appendChild(filedata.node);
                        explorer.list[type][i] = filedata;
                    })

                }
                
                else { break; }
            }
            explorer.list.rendered[type] = i;
            explorer.list[type] = loadingList;
        }
        
    }, err => console.log('Skip applying parsed list', err))

    // 4. Finish up opening a path.
    .then(() => {
        window.history.pushState('', '', `/drive${explorer.loadingPath}`);

        explorer.currentPath = explorer.loadingPath;

        let isRoot = explorer.currentPath == '/';
        // 4-1. Disable Arrow-back button on header, if currentPath is the root dir.
        if (isRoot) {
            document.body.setAttribute('root', 'true');
            header.primaryButton.icon.src = `${ICON_PATH}home.svg`
            header.title.node.innerHTML = 'Drive';

            let event = 'click';
            header.primaryButton.node.removeEventListener(event, header.primaryButton.currentEl[event]);

        } else {
            document.body.setAttribute('root', 'false');
            header.primaryButton.icon.src = `${ICON_PATH}arrow-back.svg`
            header.title.node.innerHTML = explorer.currentPath.match(/[^/]+\/$/)[0].replace('/', '');

            let event = 'click',
                callback = evt => {
                    let parentPath = explorer.currentPath.replace(/[^/]+\/$/, '');
                    explorer.openDir(parentPath)
                }

            header.primaryButton.node.removeEventListener(event, header.primaryButton.currentEl[event]);
            header.primaryButton.node.addEventListener(event, callback);
            header.primaryButton.currentEl[event] = callback;
        }

    }, err => console.log(`Failed opening dir [${path}].`, err))

    .catch(err => console.log('Error occured while finishing up opening dir.', err))
}


// Initialize!
explorer.openDir(explorer.currentPath);













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

