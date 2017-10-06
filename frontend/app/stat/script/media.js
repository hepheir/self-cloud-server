var player = document.getElementById('ap-player');
var sourceDOM = document.getElementById('ap-source');
var playlistDOM = document.querySelector('.playlist');

var playlist = new Array();
var nowPlaying = 0;

function updatePlaylist() {
    playlist = document.querySelectorAll('.playlist .item');
}

function quePlaylist(src) {
    let li = document.createElement('li');
    li.className = 'item';
    li.setAttribute('title', title);
    li.setAttribute('src', src);
    li.setAttribute('index', playlist.length + 1);
    li.innerHTML = title;

    playlistDOM.appendChild(li);
    playlist.push(li);

    console.log('playlist updated: ', title);

    if (playlist.length == 1) {
        sourceDOM.src = src;
        player.load();
        player.play();
    }
}

function onPlaylistItemClickEl(evt) {
    let e = evt.currentTarget;
}


player.addEventListener('ended', onendedEl);

function onendedEl() {
    console.log('on ended');

    nowPlaying++;
    if (nowPlaying >= playlist.length) {
        nowPlaying -= playlist.length;
    }

    sourceDOM.src = playlist[nowPlaying].src;

    player.load();
    player.play();
}


const playerLayoutDOM = document.querySelector('.player-layout');

playerLayoutDOM.addEventListener('click', onclickEl);

function onclickEl() {
    togglePlaylist();
}


function isPlaylistOn() {
    return playerLayoutDOM.hasAttribute('playlist');
}

function togglePlaylist() {
    console.log('toggle playlist');
    if (isPlaylistOn()) {
        playerLayoutDOM.removeAttribute('playlist');
    } else {
        playerLayoutDOM.setAttribute('playlist', '');
    }
}