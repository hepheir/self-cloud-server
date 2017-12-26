'use strict';

class Explorer {
    constructor() {
        this.list = {
            folder: new Array(),
            file: new Array(),

            node: {
                folder: document.getElementById('explorer-list__folder'),
                file:   document.getElementById('explorer-list__file')
            }
        };

        this.status = {
            currentPath: decodeURIComponent(location.pathname.replace('/drive/', '/')),
            loadingPath: undefined,
            
            rendered: {
                folder: 0,
                file: 0
            }
        };

        this.option = {
            folderToTop: true,
            maxRender: {
                folder: undefined,
                file: undefined,
            },
            isSelectMode: false
        };
        
        this.initialize = this.initialize.bind(this);
        this.parseList = this.parseList.bind(this);
        this.appendNodes = this.appendNodes.bind(this);
        this.onTitleClick = this.onTitleClick.bind(this);
        this.onSecondaryButtonClick = this.onSecondaryButtonClick.bind(this);
        this.readDir = this.readDir.bind(this);
        this.openDir = this.openDir.bind(this);

        this.initialize();
    }

    initialize() {
        this.openDir(this.status.currentPath);

        // on back button click
        window.onpopstate = () => {
            if (this.status.currentPath == '/') {
                return;
            }

            let path = this.status.currentPath.replace(/[^/]+\/$/, '');
            this.openDir(path);
        }
    }

    parseList(list) {
        let path = this.status.loadingPath === undefined ? this.status.currentPath : this.status.loadingPath;
    
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
        if (this.option.folderToTop) {
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

    appendNodes(filedata) {
        return new Promise((resolve, reject) => {
        // Title
    
            filedata.title.node = createElementShortCut(
                'span', {class: 'title'},
                [document.createTextNode(filedata.name)]
            );
    
            // Add Event listner
            let t_event = 'click',
                t_callback = this.onTitleClick;
    
            filedata.title.node.addEventListener(t_event, t_callback);
            filedata.title.currentEl[t_event] = t_callback;
    
    
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

            // Add Event listner
            let sb_event = 'click',
                sb_callback = this.onSecondaryButtonClick;

            filedata.secondaryButton.node.addEventListener(sb_event, sb_callback);
            filedata.secondaryButton.currentEl[sb_event] = sb_callback;
    
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

    onTitleClick(evt) {
        let li = evt.currentTarget.parentNode;
        
        let filedata = {
            type: li.getAttribute('type'),
            path: li.getAttribute('path')
        };

        if (filedata.type == 'folder') {
            this.openDir(filedata.path);
        }
        else if (filedata.type == 'audio' && audio !== undefined) {
            audio.addToPlaylist(filedata.path, audio.status.playlist, audio.status.index + 1, () => {
                audio.play(audio.status.index + 1);
            });
        }
        else if (confirm(`[${li.getAttribute('path')}] 다운 받으시겠습니까?`)) {
            location.assign(`http://unit.bojeong.hs.kr/stream${li.getAttribute('path')}`);
        }
    }

    onSecondaryButtonClick(evt) {
        let li = evt.currentTarget.parentNode;
        
        let filedata = {
            type: li.getAttribute('type'),
            path: li.getAttribute('path')
        };

        if (filedata.type == 'folder') {
            alert(filedata.path);
        }
        else if (filedata.type == 'audio' && audio !== undefined) {
            let index = prompt('Playlist add\n>>> enter index number: ');

            audio.addToPlaylist(filedata.path, audio.status.playlist, index);
        }
    }

    readDir(path) {
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
            }
            else if (response.error) {
                throw response.error;
            }
            else {
                throw 'Unexpected Error.';
            }
        })
    }

    openDir(path) {
        this.status.loadingPath = path;
        
        // 1. Request directory data to server.
        return this.readDir(path)
        .catch(err => {
            this.status.loadingPath = undefined;
            throw 'Cancel openDir.';
        })
        
        // 2. Parse list.
        .then(list => this.parseList(list), err => console.log(err))
    
        // 3. Apply parsed list.
        .then(list => {
            if (this.status.loadingPath == undefined) {
                console.log(list);
                throw 'status.loadingPath is undefined';
            }
    
            for (let type in list) {
                let listDOM = this.list.node[type];
    
                let currentList = this.list[type],
                    loadingList = list[type];
    
                let maxRender = this.option.maxRender[type];
    
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
        
                        this.appendNodes(filedata)
                        .then(filedata => {
                            let i = filedata.index,
                                type = filedata.type == 'folder' ? 'folder' : 'file';
                                
                            delete filedata.index;
                            
        
                            listDOM.appendChild(filedata.node);
                            this.list[type][i] = filedata;
                        })
    
                    }
                    
                    else { break; }
                }
                this.status.rendered[type] = i;
                this.list[type] = loadingList;
            }
            
        })
    
        // 4. Finish up opening a path.
        .then(() => {
            // 4-1. Update path status.
            window.history.pushState('', '', `/drive${this.status.loadingPath}`);
            this.status.currentPath = this.status.loadingPath;

            // 4-2. Scroll to Top.
            document.querySelector('.body-layout').scrollTop = 0;
            

            let isRoot = this.status.currentPath == '/';
            // 4-3-1. if on Root dir.
            if (isRoot) {
                document.body.setAttribute('root', 'true');
                header.primaryButton.icon.src = `${ICON_PATH}home.svg`
                header.title.node.innerHTML = 'Drive';
    
                let event = 'click';
                header.primaryButton.node.removeEventListener(event, header.primaryButton.currentEl[event]);
    
            }
            // 4-3-2. if not on Root dir.
            else {
                document.body.setAttribute('root', 'false');
                header.primaryButton.icon.src = `${ICON_PATH}arrow-back.svg`
                header.title.node.innerHTML = this.status.currentPath.match(/[^/]+\/$/)[0].replace('/', '');
    
                let event = 'click',
                    callback = evt => {
                        let parentPath = this.status.currentPath.replace(/[^/]+\/$/, '');
                        this.openDir(parentPath)
                    }
    
                header.primaryButton.node.removeEventListener(event, header.primaryButton.currentEl[event]);
                header.primaryButton.node.addEventListener(event, callback);
                header.primaryButton.currentEl[event] = callback;
            }
    
        }, err => {
            console.log(err);
            let that = this;
            window.setTimeout(() => {
                that.openDir('/');
            }, 2000);
        })
    
        .catch(err => console.log(err))
    }
}

var explorer = new Explorer();