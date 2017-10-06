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
player.addEventListener('ended', onEndedEl);

function onPlayerClickEl() {
    togglePlaylist();
}

function onEndedEl() {
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

    let prePlayed;
    if (nowPlaying !== undefined) {
        prePlayed = v_playlist[nowPlaying];
    }

    nowPlayed.node.setAttribute('playing', '');

    nowPlaying = v_playlist.indexOf(nowPlayed);

    playSong(nowPlayed, prePlayed);
}

function playByIndex(index) {
    if (index == undefined) {
        index = v_playlist.length - 1;
    }

    if (index >= v_playlist.length) {
        index -= v_playlist.length;
    }

    let nowPlayed = v_playlist[index],
        prePlayed;

    if (nowPlaying !== undefined) {
        prePlayed = v_playlist[nowPlaying];
    } 

    nowPlaying = index;

    playSong(nowPlayed, prePlayed);
}

function playSong(now, prev) {
    now.node.setAttribute('playing', '');

    if (prev) {
        prev.node.removeAttribute('playing');
    }

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

function quePlaylist(title, artist, src) {
    let id = 'id_' + Date.now();

    console.log('queued to playlist: ', id);
    
    v_playlist.push({
        id: id,
        title: title,
        artist: artist,
        src: src,
        node: createPlaylistElement(id, title)
    });

    if (v_playlist.length == 1) {
        playByIndex(0);
    }

    playerLayoutDOM.removeAttribute('saved');

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

    li.addEventListener('click', evt => {
        let id = evt.currentTarget.getAttribute('id');
        playById(id);
    });

    playlistDOM.appendChild(li);

    return li;
}

// BACK UP CONTROL
savePlaylistDOM.addEventListener('click', savePlaylist);
loadPlaylistDOM.addEventListener('click', loadPlaylist);

var xhr = new XMLHttpRequest();
function savePlaylist() {
    let data = '';

    v_playlist.map(e => {
        data += `&${e.src}`;
    })

    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            playerLayoutDOM.setAttribute('saved', '');
        }      
    }
    xhr.open('get', location.origin + '/playlist/?save' + data, true);
    xhr.send();
}
function loadPlaylist() {
    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let pl_load = JSON.parse(xhr.responseText);

            console.log(pl_load);

            v_playlist = new Array();
            playlistDOM.innerHTML = '';

            pl_load.map(elem => {
                elem.id = 'id_' + Date.now();
                elem.node = createPlaylistElement(elem.id, elem.title);

                v_playlist.push(elem);
            })

            playerLayoutDOM.setAttribute('saved', '');
        }      
    }
    xhr.open('get', location.origin + '/playlist/', true);
    xhr.send();
}