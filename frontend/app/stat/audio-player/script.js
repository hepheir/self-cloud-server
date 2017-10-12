isAudioPlayerSupported = true;

const audio_player = document.getElementById('audio-player');


var audio_playlist = new Array(),
    audio_nowPlaying = undefined;


// for Mobile chrome useage.
function activatePlayer() {
    let activator = document.getElementById('audio-playerLayout');
    activator.addEventListener('click', a);

    function a() {
        audio_player.play();

        activator.removeEventListener('click', a);
    }
}



audio_asyncLoadPlaylist()
    .then(playlist => {
        audio_playlist = playlist;
        
        audio_player.addEventListener('loadeddata', audio_onLoadedData);
        audio_player.addEventListener('ended', audio_onEnded);

        audio_nowPlaying = -1;
        audio_onEnded();
    })

    
function audio_onLoadedData(evt) {
    let player = evt.currentTarget;

    player.currentTime = 0;
    // player.currentTime = player.duration - 8;
    player.play();
}
function audio_onEnded() {
    let queueIndex = audio_nowPlaying + 1;
    if (queueIndex >= audio_playlist.length)
        queueIndex = 0;

    audio_player.src = `/stream${audio_playlist[queueIndex]}`;

    audio_nowPlaying = queueIndex;
}

function audio_asyncLoadPlaylist() {
    let xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                let playlist = xhr.response;
                resolve(playlist);
            }
        }
        xhr.open('get', '/playlist/', true);
        xhr.responseType = 'json';
        xhr.send();
    })
}

/**
 * 
 * @param {String} path 
 * @return {Buffer}
 */
function audio_asyncLoadAudioBuffer(path) {
    let xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                let arrayBuffer = xhr.response;
                if (arrayBuffer) {
                    resolve(arrayBuffer);
                } else {
                    reject();
                }
            }
        }
        xhr.open('get', `/stream${path}`, true);
        xhr.responseType = 'arraybuffer';
        xhr.send();
    })
}



// intensed area


var audioCtx = new AudioContext();

var aud_source = audioCtx.createMediaElementSource(audio_player);
aud_source.connect(audioCtx.destination);



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