var player      = document.getElementById('ap-player'),
    playerDOM   = document.querySelector('.player'),
    playlistDOM = document.getElementById('ap-playlist'),
    sourceDOM   = document.getElementById('ap-source');

var sourceList = new Array(),
    nowPlaying = 0;

// Player Control
playerDOM.addEventListener('click', onPlayerClickEl);
player.addEventListener('ended', onEndedEl);

function onPlayerClickEl() {
    togglePlaylist();
}

function onEndedEl() {
    playNow(nowPlaying + 1);
}

function playNow(index) {
    if (index == undefined) {
        index = sourceList.length - 1;
    } else {
        // 1 based index => 0 based index.
        index--;
    }

    if (index >= sourceList.length) {
        index -= sourceList.length;
    }

    sourceDOM.src = sourceList[index];

    nowPlaying = index + 1;

    player.load();
    player.addEventListener('loadeddata', () => {
        if(player.readyState >= 2) {
            player.play();
        }
    })
}

// Playlist Control
function quePlaylist(title, artist, src) {
    sourceList.push(src);

    let li = document.createElement('li');
    li.className = 'item';

    li.setAttribute('index', sourceList.length);

    li.setAttribute('title', title);
    li.setAttribute('artist', artist);
    li.setAttribute('src', src);

    li.innerHTML = title;

    li.addEventListener('click', evt => {
        let index = evt.currentTarget.getAttribute('index');

        playNow(index);
    })

    playlistDOM.appendChild(li);

    if (sourceList.length == 1) {
        playNow(1);
    }
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