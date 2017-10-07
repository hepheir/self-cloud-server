// GLOBAL PRESET
var player      = document.getElementById('ap-player'),
    playerDOM   = document.querySelector('.player'),
    playerTitleDOM = document.getElementById('player-title'),
    playerArtistDOM = document.getElementById('player-artist'),
    playlistDOM = document.getElementById('ap-playlist'),
    sourceDOM   = document.getElementById('ap-source'),
    playerLayoutDOM = document.querySelector('.player-layout'),
    loadPlaylistDOM = document.getElementById('playlist-load'),
    savePlaylistDOM = document.getElementById('playlist-save');

/**
 * {
 *     id: '',
 *     title: '',
 *     artist: '',
 *     src: '',
 *     node: NODE
 * }
 */
var v_playlist = new Array(),
    nowPlaying = undefined;

// Player Control
playerDOM.addEventListener('click', onPlayerClickEl);
player.addEventListener('ended', onPlayerEndedEl);

function onPlayerClickEl() {
    togglePlaylist();
}

function onPlayerEndedEl() {
    if (v_playlist.length < 1) {
        return;
    }
    playByIndex(nowPlaying + 1);
}

function playById(id) {
    let nowPlayed;

    for (let i = 0; i < v_playlist.length; i++) {
        if (v_playlist[i].id == id) {
            nowPlayed = v_playlist[i];
            break;
        }
    }

    nowPlayed.node.setAttribute('playing', '');

    nowPlaying = v_playlist.indexOf(nowPlayed);
    playSong(nowPlayed);
}

function playByIndex(index) {
    if (index == undefined) {
        index = v_playlist.length - 1;
    }

    if (index >= v_playlist.length) {
        index -= v_playlist.length;
    }

    let nowPlayed = v_playlist[index];

    nowPlaying = index;

    playSong(nowPlayed);
}

function playSong(now) {
    now.node.setAttribute('playing', '');

    v_playlist.map(elem => {
        if (elem != now) {
            elem.node.removeAttribute('playing');
        }
    })

    sourceDOM.src = now.src;

    player.load();
    player.addEventListener('loadeddata', () => {
        if(player.readyState >= 2) {
            playerTitleDOM.innerHTML = now.title;
            playerArtistDOM.innerHTML = now.artist;
            
            player.play();
        }
    })
}


// Playlist Control

function quePlaylist(title, artist, src, playnow) {
    playnow = playnow || false;

    let id = 'id_' + Date.now();
    ajaxGet(src.replace('/stream/', '/mp3/'), xhr => {
        let tags = JSON.parse(xhr.responseText);

        console.log('queued to playlist: ', id, tags);

        v_playlist.push({
            id: id,
            title: tags.title,
            artist: tags.artist,
            src: src,
            node: createPlaylistElement(id, tags.title)
        });
    
        if (v_playlist.length == 1) {
            playByIndex(0);
            
        } else if (playnow) {
            playByIndex();
        }
    
        playerLayoutDOM.removeAttribute('saved');
    })

    return id;
}
function removeFromPlaylist(id) {
    v_playlist = v_playlist.filter(elem => {
        if (elem.id == id) {
            elem.node.parentNode.removeChild(elem.node);
            return false;
        } else {
            return true;
        }
    })
    
    playerLayoutDOM.removeAttribute('saved');
    return;
}

function isPlaylistOn() {
    return document.body.hasAttribute('playlist');
}
function togglePlaylist() {
    if (isPlaylistOn()) {
        document.body.removeAttribute('playlist');
    } else {
        document.body.setAttribute('playlist', '');
    }
}

function createPlaylistElement(id, title) {
    let li = document.createElement('li');
    li.setAttribute('id', id);
    li.className = 'item';
    li.innerHTML = title;

    li.addEventListener('click', listElementOnClick);
    li.addEventListener('mousedown', listElementOnMouseDown);
    li.addEventListener('mouseup', listElementOnMouseUp);

    li.addEventListener('touchstart', listElementOnMouseDown);
    li.addEventListener('touchmove', listElementOnMouseUp);
    li.addEventListener('touchend', listElementOnMouseUp);

    playlistDOM.appendChild(li);

    return li;
}

function listElementOnClick(evt) {
    let id = evt.currentTarget.getAttribute('id');
    playById(id);
}

var listElemTimer;
function listElementOnMouseDown(evt) {
    let id = evt.currentTarget.getAttribute('id');

    listElemTimer = window.setTimeout(function() {
        removeFromPlaylist(id);
        evt.stopPropagation();
    }, 1000);
}
function listElementOnMouseUp(evt) {
    window.clearTimeout(listElemTimer);
}

// BACK UP CONTROL
savePlaylistDOM.addEventListener('click', savePlaylist);
loadPlaylistDOM.addEventListener('click', loadPlaylist);

function ajaxGet(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
        if (this.readyState == 4 && this.status == 200) {
            callback(this);
        }
    }
    xhr.open('get', url, true);
    xhr.send();
}

function savePlaylist() {
    let data = '';

    v_playlist.map(e => {
        data += `&${e.src}`;
    })

    ajaxGet(location.origin + '/playlist/?save' + data, xhr => {
        playerLayoutDOM.setAttribute('saved', '');
    })
}

function loadPlaylist() {
    let xhr = new XMLHttpRequest();

    xhr.open('get', location.origin + '/playlist/', false);
    xhr.send();

    let pl_load = JSON.parse(xhr.responseText);

    v_playlist = new Array();
    playlistDOM.innerHTML = '';

    let firstIdNum = Date.now();

    pl_load.map(src => {
        let xhr = new XMLHttpRequest();

        xhr.open('get', src.replace('/stream/', '/mp3/'), false);
        xhr.send();
        
        let tags = JSON.parse(xhr.responseText);
        
        let id = 'id_' + firstIdNum++;

        v_playlist.push({
            id: id,
            title: tags.title,
            artist: tags.artist,
            src: src,
            node: createPlaylistElement(id, tags.title)
        });

        return src;
    })

    playerLayoutDOM.setAttribute('saved', '');
}