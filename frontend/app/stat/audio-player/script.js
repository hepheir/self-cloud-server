isAudioPlayerSupported = true;

var audio_sound = {
    'true': new Audio(),
    'false': new Audio()
};
var audio_turn = true;

var audio_playlist = new Array(),
    audio_nowPlaying = undefined;


audio_asyncLoadPlaylist()
    .then(playlist => {
        audio_playlist = playlist;
        
        audio_sound[!audio_turn].addEventListener('loadeddata', firstPlay);
        function firstPlay(evt) {
            evt.currentTarget.removeEventListener('loadeddata', firstPlay);
            audio_onEnded();
        }

        audio_sound[!audio_turn].src = `/stream${playlist[0]}`;
        audio_nowPlaying = -1;
        // audio_onEnded();
        
        audio_sound[audio_turn].addEventListener('ended', audio_onEnded);
        audio_sound[!audio_turn].addEventListener('ended', audio_onEnded);
    })


function audio_onEnded() {
    console.log('ended!');
    audio_turn = !audio_turn;
    audio_nowPlaying++;

    audio_sound[audio_turn].currentTime = 0;
    audio_sound[audio_turn].currentTime = audio_sound[audio_turn].duration - 10;
    audio_sound[audio_turn].play();

    let queueIndex = audio_nowPlaying + 1;
    if (queueIndex >= audio_playlist.length) {
        queueIndex = 0;
    }

    audio_sound[!audio_turn].src = `/stream${audio_playlist[queueIndex]}`;
}

function audio_asyncLoadPlaylist() {
    let xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                let playlist = JSON.parse(xhr.responseText);
                resolve(playlist);
            }
        }
        xhr.open('get', '/playlist/', true);
        xhr.send();
    })
}