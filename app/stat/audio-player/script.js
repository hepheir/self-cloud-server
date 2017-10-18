var audio = {
    status: {
        playlist: 'default',
        index: 0
    },
    player: {
        node: document.getElementById('audio-player')
    },
    playlist: {
        node: undefined,
        list: new Object,

        download: undefined, // Function
        upload: undefined, // Function

        queue: undefined, // Function
        remove: undefined // Function
    },

    getMetadata: undefined, // Function

    option: {
        shuffle: false,
        loop: true
    }    
}

audio.getMetadata = function(path) {
    let xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                resolve(xhr.response);
            }
        }

        xhr.open('get', `/audio-meta${path}`, true);
        xhr.responseType = 'json';
        xhr.send();
    })
    .then(responseData => {
        if (responseData !== null) {
            return responseData;

        } else {
            throw 'No meta data found.';
        }
    })
}

audio.playlist.download = function(playlistID) {
    
    let clientID;
    if (typeof user !== undefined) {
        clientID = user.id;
    } else {
        clientID = 'guest';
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
            audio.playlist.list[playlistID] = responseData;
            return responseData;

        } else {
            throw 'Downloaded playlist is not an Array?!';
        }
    })
}

audio.playlist.upload = function(playlistID) {
    
    let playlist = audio.playlist.list[playlistID];
    if (!playlist) {
        return null;
    }

    let clientID;
    if (typeof user !== undefined) {
        clientID = user.id;
    } else {
        clientID = 'guest';
    }
    
    // encodeURIComponent before sending data to server.
    clientID   = encodeURIComponent(clientID);
    playlistID = encodeURIComponent(playlistID);
    playlistURI = playlist.map(encodeURIComponent).join('&');

    let xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                resolve(xhr.response);
            }
        }
        xhr.open('get', `/playlist/${clientID}/${playlistID}/?${playlistURI}`, true);
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

audio.playlist.queue = function(playlistID, index, path){
    audio.getMetadata(path)
    .then(metadata => {
        let playlist = new Array();
    
        for (let i = 0; i < audio.playlist.list[playlistID].length + 1; i++) {
            if (i == index) {
                playlist.push(metadata);
            }
            else if (i > index) {
                playlist.push(audio.playlist.list[playlistID][i - 1]);
            }
            else {
                playlist.push(audio.playlist.list[playlistID][i]);
            }
        }
    }, err => console.log(err));
}


// // intensed area

// audio.playlist.download('default');

// var audioCtx = new AudioContext();

// var hey = new Audio();

// var aud_source = audioCtx.createMediaElementSource(hey);
// aud_source.connect(audioCtx.destination);

// document.getElementById('audio-snackbar__action').onclick = evt => {
//     evt.currentTarget.parentNode.style.display = 'none';

//     console.log(audio.playlist.list);
//     hey.src = '/stream' + audio.playlist.list.default[0];
//     hey.play();
// };



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
