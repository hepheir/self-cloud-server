var player = document.createElement('audio');

var playlist = new Array();

var nowPlaying = 0;

function quePlaylist(src) {
    playlist.push(src);
    console.log('playlist updated: ', src);

    if (playlist.length == 1) {
        player.appendChild(createSource(playlist[0]));
        player.load();
        player.play();
    }
}


player.setAttribute('controls', '');
player.setAttribute('autoplay', '');
player.setAttribute('pre-load', 'auto');


player.addEventListener('ended', onEnded);


function onEnded() {
    console.log('on ended');

    nowPlaying++;
    if (nowPlaying >= playlist.length) {
        nowPlaying -= playlist.length;
    }

    let src = playlist[nowPlaying];

    player.innerHTML = '';
    player.appendChild(createSource(src));

    player.load();
    player.play();
}

function createSource(src) {
    let source = document.createElement('source');
    source.src = src;

    let extension = src.match(/[^.]+$/)[0];

    let type;
    if (extension == 'mp3') {
        type = 'mpeg';
    } else {
        type = extension.toLowerCase();
    }

    source.type = `audio/${type}`;
    
    return source;
}



player.style.width = '100%';
player.style.position = 'fixed';
player.style.bottom = 0;
player.style.left = 0;

document.querySelector('.body-layout').appendChild(player);