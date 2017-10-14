var audio = {
    status: {
        playlist: 'default',
        index: 0
    },
    player: undefined,
    playlist: new Object(),

}

var audio_autoPlay = false;

const audio_player = document.getElementById('audio-player');



audio.downloadPlaylist = function(playlistID) {
    let clientID = 'guest';
    if (typeof user !== undefined) {
        clientID = user.id;
    }

    let xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                resolve(xhr.response);
            }
        }
        xhr.open('get', `/playlist/${clientID}/${playlistID}/`, true);
        xhr.responseType = 'json';
        xhr.send();
    })
    .then(responseData => {
        if (Array.isArray(responseData)) {
            audio.playlist[playlistID] = responseData;
            return responseData;

        } else {
            console.log(`Downloaded playlist is not an Array?!`, responseData);
            throw 'Error';
        }
    })
}

audio.uploadPlaylist = function(playlistID) {
    if (!audio.playlist[playlistID]) {
        return null;
    }

    let clientID = 'guest';
    if (typeof user !== undefined) {
        clientID = user.id;
    }

    let playlist = audio.playlist[playlistID];
    
    // encodeURIComponent before sending data to server.
    clientID   = encodeURIComponent(clientID);
    playlistID = encodeURIComponent(playlistID);
    playlist = playlist.map(encodeURIComponent).join('&');

    let xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                resolve(xhr.response);
            }
        }
        xhr.open('get', `/playlist/${clientID}/${playlistID}/?${playlist}`, true);
        xhr.responseType = 'json';
        xhr.send();
    })
    .then(responseData => {
        if (responseData == playlist) {
            console.log('Playlist successfully uploaded.');
            return responseData;
        } else {
            console.log(`Sent playlist doesn't match with received playlist`);
            throw 'Error';
        }
    })
}

audio.


audio_asyncLoadPlaylist(clientID)
    .then(playlist => {
        isAudioPlayerSupported = true;
        explorer_asyncOpenDir(explorer_currentPath); // From explorer
        
        audio_playlist = playlist;
        
        audio_player.addEventListener('loadeddata', audio_onLoadedData);
        audio_player.addEventListener('ended', audio_onEnded);

        if (playlist.length != 0) {
            audio_load(0);
        }
        audio_nowPlaying = 0;
    })

    

function audio_load(index) {
    audio_player.src = `/stream${audio_playlist[index]}`;
}

function audio_onLoadedData(evt) {
    let player = evt.currentTarget;

    player.currentTime = 0;
    // player.currentTime = player.duration - 8;
    if (audio_autoPlay) {
        console.log('now Playing: ', audio_playlist[audio_nowPlaying].match(/[^/]+$/)[0]);
        player.play();
    }
}

function audio_onEnded() {
    // Option.
    audio_autoPlay = true;

    let queueIndex = audio_nowPlaying + 1;
    if (queueIndex >= audio_playlist.length)
        queueIndex = 0;

    audio_load(queueIndex);
    audio_player.load();

    audio_nowPlaying = queueIndex;
}


function audio_queueSongToPlaylist(path) {
    audio_playlist.push(path);
    audio_asyncSynchronizePlaylistWithServer(clientID)
    console.log('[Queued] playlist updated:', audio_playlist);

}
function audio_removeSongFromPlaylist(path) {
    audio_playlist = audio_playlist.filter(src => {
        return path != src;
    });
    audio_asyncSynchronizePlaylistWithServer(clientID);
    console.log('[Removed] playlist updated:', audio_playlist);
}



// intensed area


var audioCtx = new AudioContext();

var hey = new Audio();
hey.src = audio_playlist[0];

var aud_source = audioCtx.createMediaElementSource(audio_player);
aud_source.connect(audioCtx.destination);

document.getElementById('audio-snackbar__action').onclick = evt => {
    evt.currentTarget.parentNode.style.display = 'none';

    let audio = audio_player;
    console.log('now Playing: ', audio_playlist[audio_nowPlaying].match(/[^/]+$/)[0]);
    audio.play();
    return audio.paused;
};



// audio_asyncLoadAudioBuffer('/server/music/17-09 D/J.Fla-05-Viva La Vida.mp3')
// .then(arrayBuffer => {
//     let byteArray = new Uint8Array(arrayBuffer);
    
//     // Stereo.
//     let channels = 2;

//     // Create an empty two second stereo buffer at the
//     // sample rate of the AudioContext
//     let frameCount = audioCtx.sampleRate * 1.0;
    
//     var myArrayBuffer = audioCtx.createBuffer(channels, frameCount, audioCtx.sampleRate);
//     // Fill the buffer with white noise;
//     // just random values between -1.0 and 1.0
//     for (var channel = 0; channel < channels; channel++) {
//         // This gives us the actual array that contains the data
//         var nowBuffering = myArrayBuffer.getChannelData(channel);
//         for (var i = 0; i < frameCount; i++) {
//         // Math.random() is in [0; 1.0]
//         // audio needs to be in [-1.0; 1.0]
//         nowBuffering[i] = Math.random() * 2 - 1;
//         }
//     }

//     // Get an AudioBufferSourceNode.
//     // This is the AudioNode to use when we want to play an AudioBuffer
//     var source = audioCtx.createBufferSource();

//     // set the buffer in the AudioBufferSourceNode
//     source.buffer = myArrayBuffer;

//     // connect the AudioBufferSourceNode to the
//     // destination so we can hear the sound
//     source.connect(audioCtx.destination);

//     // start the source playing
//     source.start();
// })


// /**
//  * 
//  * @param {String} path 
//  * @return {Buffer}
//  */
// function audio_asyncLoadAudioBuffer(path) {
//     let xhr = new XMLHttpRequest();
//     return new Promise((resolve, reject) => {
//         xhr.onreadystatechange = () => {
//             if (xhr.readyState == 4 && xhr.status == 200) {
//                 let arrayBuffer = xhr.response;
//                 if (arrayBuffer) {
//                     resolve(arrayBuffer);
//                 } else {
//                     reject();
//                 }
//             }
//         }
//         xhr.open('get', `/stream${path}`, true);
//         xhr.responseType = 'arraybuffer';
//         xhr.send();
//     })
// }
