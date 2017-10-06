const listDOM = document.querySelector('ul.list');

var itemList = document.querySelectorAll('.list .item');

var isSelectMode = false,
    isFirstClickAfterSelectModeOn = false,
    selectedItems = 0,
    toggleSelectModeTimer;

function updateList() {
    itemList = document.querySelectorAll('.item');

    [].map.call(itemList, elem => {
        elem.addEventListener('click', onclickEL);
        elem.addEventListener('mousedown', onmousedownEL);
        elem.addEventListener('mouseup', onmouseupEL);
    })

    console.log('list updated: ', itemList);
}

function onclickEL(evt) {
    let item = evt.currentTarget;

    if (!isSelectMode) {
        if (isFirstClickAfterSelectModeOn) {
            isFirstClickAfterSelectModeOn = false;
            return;
        }

        let type = item.getAttribute('type'),
            path = item.getAttribute('path');

        console.log(type);

        if (type == 'folder') {
            fillList(path);

        } else if (type == 'audio') {
            // Media.js!

            let title = item.getAttribute('title'),
                artist = item.getAttribute('artist');
            path = path.replace('/drive/', '/stream/');

            quePlaylist(title, artist, path);
            playNow();

        } else {
            console.log("it's a file..!");
        }


        return;
    }

    selectItem(item);
}

function onmousedownEL() {
    toggleSelectModeTimer = window.setTimeout(toggleSelectMode, 1000);
}
function onmouseupEL() {
    window.clearTimeout(toggleSelectModeTimer)
}

function toggleSelectMode() {
    isSelectMode = !isSelectMode;

    if (isSelectMode) {
        document.body.setAttribute('select-mode', '');
        isFirstClickAfterSelectModeOn = true;
    } else {
        document.body.removeAttribute('select-mode');
        deselectAllItems();
        updateHeader();
    }
}

function selectItem(item) {
    if (item.hasAttribute('selected')) {
        item.removeAttribute('selected');
        selectedItems--;
    } else {
        item.setAttribute('selected', '');
        selectedItems++;
    }

    updateHeader();
}

function deselectAllItems() {
    [].map.call(itemList, elem => {
        if (elem.hasAttribute('selected')) {
            elem.removeAttribute('selected');
        }
    })
    selectedItems = 0;

    updateHeader();
}

function selectAllItems() {
    [].map.call(itemList, elem => {
        if (!elem.hasAttribute('selected')) {
            elem.setAttribute('selected', '');
        }
    })
    selectedItems = itemList.length;

    updateHeader();
}

const headerSelectedItems = document.querySelector('.selected-items');
function updateHeader() {
    headerSelectedItems.innerHTML = `${selectedItems} Selected`;
}



const dynamicIcon = document.querySelector('.dynamic-icon');
dynamicIcon.addEventListener('click', evt => {
    if (!isSelectMode) {
        return;
    }

    let e = evt.currentTarget;

    if (selectedItems === 0) {
        e.setAttribute('select-all', '');
        e.removeAttribute('select-none');
        e.removeAttribute('select-part');

        selectAllItems();

    } else {
        e.removeAttribute('select-all');
        e.removeAttribute('select-part');
        e.setAttribute('select-none', '');
        
        deselectAllItems();
    }
})


/**
 * Create an li element for drive-list
 * @param {String} filename
 * @param {String} type
 * @param {Boolean} secured
 * @return {HTMLDocument}
 */
function createListItem(filename, type, secured) {
    let item = document.createElement('li');
    item.className = 'item';
    item.setAttribute('type', type);

    if (type == 'folder') {
        filename = filename + '/';
    }
    filename = filename.replace('//', '/');

    item.setAttribute('path', location.href + filename);

    if (secured) {
        item.setAttribute('secured', '');
    }

    if (type == 'audio') {
        item.setAttribute('title', filename);
        // TODO
        item.setAttribute('artist', 'ARTIST');
    }

    item.innerHTML = `
    <img class="check-icon" src="/stat/icon/check.svg">
    <a class="item-layout">
        <img class="primary-icon" src="/stat/icon/${type}.svg">
        <span>${filename}</span>
        <img class="secondary-icon added" src="/stat/icon/playlist-added.svg">
        <img class="secondary-icon add" src="/stat/icon/playlist-add.svg">
    </a>`

    return item;
}

const xhr = new XMLHttpRequest();
function ajaxGet(url, callback) {
    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            callback(xhr);
        }      
    }
    xhr.open('get', url, true);
    xhr.send();
}

function fillList(url) {
    window.history.pushState('', 'DRIVE!', url);

    url = url + '?json';
    ajaxGet(url, xhr => {
        let files = JSON.parse(xhr.responseText);
        listDOM.innerHTML = '';

        files.map(f => {
            let item = createListItem(f.name, f.type, f.secured);
            listDOM.appendChild(item);
        })

        updateHeaderPath();
        updateList();
    });
}

fillList(location.href);


const KEYCODE = {
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    SHIFT: 16,
    ESC: 27,
    DELETE: 46 
}
window.addEventListener('keypress', evt => {
    if ((evt.keyCode == KEYCODE.ENTER || evt.keyCode == KEYCODE.ESC)
        && isSelectMode) {
        toggleSelectMode();
    }
})

window.onpopstate = fillList(location.href);



const parentDOM = document.querySelector('.parent');
const currentDOM = document.querySelector('.current');

parentDOM.addEventListener('click', evt => {
    let url;
    if (location.href.match(/\/$/) === null) {
        url = location.href.replace(/[^/]+$/, '');
    } else {
        url = location.href.replace(/[^/]+\/$/, '');
    }

    fillList(url);
})

function updateHeaderPath() {
    let path = location.href.match(/([^/]+)\/([^/]+)\/([^/]*)$/)[0];
    path = decodeURIComponent(path);
    path = path.split('/');

    console.log(path);
    
    let parent = path[0],
        current = path[1];

    parentDOM.innerHTML = parent;
    currentDOM.innerHTML = current;
}