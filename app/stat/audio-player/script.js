'use strict';

class AudioPlayer {
    constructor() {
        this.status = {
            playlist: 'default',
            index: 0,
            player: 0,
            preloaded: {
                0: false,
                1: false
            }
        };
        this.player = {
            node: {
                primaryTitle: document.getElementById('audio-primary-title'),
                secondaryTitle: document.getElementById('audio-secondary-title'),

                prev: document.getElementById('audio-prev'),

                play: document.getElementById('audio-play'),
                playIcon: document.getElementById('audio-play-icon'),

                next: document.getElementById('audio-next')
            },

            0: new Audio(),
            1: new Audio()
        };
        this.playlist = {
            node: undefined,
            default: new Array()
        };
        this.option = {
            preload: true,
            autoplay: true,
            autosave: true,
            shuffle: false,
            loop: true
        };

        this.initialize = this.initialize.bind(this);
        this.onPlayButtonClick = this.onPlayButtonClick.bind(this);
        this.onPlayerEnded = this.onPlayerEnded.bind(this);
        this.play = this.play.bind(this);
        this.preload = this.preload.bind(this);
        this.downloadPlaylist = this.downloadPlaylist.bind(this);
        this.uploadPlaylist = this.uploadPlaylist.bind(this);
        this.queuePlaylist = this.queuePlaylist.bind(this);

        this.initialize();
    }

    initialize() {
        this.downloadPlaylist('default')
            .then(playlist => {
                this.playlist['default'] = playlist;

                this.preload(0, 0);
                if (this.option.autoplay) {
                    this.play(0, 0);
                }
                
                this.status.player = 0;

                if (this.option.preload && this.playlist['default'].length > 1) {
                    this.preload(1, 1);
                }
            })

        for (let i = 0; i < 2; i++) {
            this.player[i].addEventListener('ended', this.onPlayerEnded);
        }

        this.player.node.play.addEventListener('click', this.onPlayButtonClick);
        this.player.node.next.addEventListener('click', this.onPlayerEnded);
    }

    onPlayButtonClick(evt) {
        let player = this.player[this.status.player];
        if (player.paused) {
            player.play();
            this.player.node.playIcon.src = `${ICON_PATH}pause.svg`;
        }
        else {
            player.pause();
            this.player.node.playIcon.src = `${ICON_PATH}play.svg`;
        }
    }

    onPlayerEnded(evt) {
        this.player.node.playIcon.src = `${ICON_PATH}play.svg`;

        let currentPlaylist = this.playlist[this.status.playlist],
            currentPlayerID = this.status.player,
            nextPlayerID = this.status.player == 0 ? 1 : 0;
        // Play next song on demand.
        if (this.option.autoplay) {
            let nextIndex = this.status.index + 1;
            
            // as we reach the end...
            if (currentPlaylist.length <= nextIndex) {
                nextIndex -= currentPlaylist.length;
                // Stop playing songs, if user disabled loop option.
                if (!this.option.loop) {
                    return;
                }
            }

            this.play(nextPlayerID, nextIndex);
        }
    }

    play(playerID, index) {
        let currentPlaylist = this.playlist[this.status.playlist];

        let player = this.player[playerID];
        let theOtherplayerID = playerID == 0 ? 1 : 0;

        // If preloaded, we don't have to load it twice :)
        let isPreloaded = player.src == currentPlaylist[index];
        if (isPreloaded) {
            player.play();
        }
        else {
            player.src = `/stream${currentPlaylist[index]}`;
            player.load();
            player.play();
        }

        // Update DOM
        this.player.node.playIcon.src = `${ICON_PATH}pause.svg`;
        let title = currentPlaylist[index].match(/([^/]+)$/)[0].replace('.mp3', '');
        this.player.node.primaryTitle.innerHTML = title;

        // Update status
        this.status.player = playerID;
        this.status.index = index;

        // Preload the next song on demand.
        if (this.option.preload) {
            let queueIndex = index + 1;
            if (currentPlaylist.length <= queueIndex) {
                queueIndex -= currentPlaylist.length;
            }
            this.preload(theOtherplayerID, queueIndex);
        }
    }

    preload(playerID, index) {
        let currentPlaylist = this.playlist[this.status.playlist];
        let player = this.player[playerID];
        
        if (index >= currentPlaylist.length) {
            throw `index is bigger than playlist length.`;
        }

        player.src = `/stream${currentPlaylist[index]}`;
        player.currentTime = 0;
        player.load();
    }

    downloadMetadata(path) {
        // 1. Request source meta data from server.
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
        // 2. Throw an error if we didn't get what we want.
        .then(res => {
            if (res !== null) {
                return res;
            }
            else {
                throw 'No meta data found.';
            }
        })
    }

    downloadPlaylist(playlistID) {
        if (playlistID == 'node') {throw 'playlistID should not be `node`. please choose another name.'}

        // 1. Set client ID.
        let clientID;
        if (typeof user !== undefined) { // Check if module user has loaded.
            clientID = user.id;
        }
        else {
            clientID = 'guest';
        }
        // 2. Request playlist data from server.
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
        // 3. Sync local playlist with received playlist.
        .then(res => {
            if (Array.isArray(res)) {
                this.playlist[playlistID] = res;
            }
            else if (res === null) {
                this.playlist[playlistID] = new Array();
            }
            else {
                console.log(res);
                throw 'Unexpected response data.';
            }
            return res;
        })
    }
    
    uploadPlaylist(playlistID) {
        if (playlistID == 'node') {throw 'playlistID should not be `node`. please choose another name.'}

        // 1. Set client ID.
        let clientID;
        if (typeof user !== undefined) { // Check if module user has loaded.
            clientID = user.id;
        }
        else {
            clientID = 'guest';
        }
        
        // 2. Prepare for AJAX request.
        let playlistURI;
        if (this.playlist[playlistID]) {
            playlistURI = this.playlist[playlistID].map(encodeURIComponent).join('&');
        }
        else {
            playlistURI = '';
        }

        // 3. Upload playlist data to server.
        let xhr = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    resolve(xhr.response);
                }
            }
            xhr.open('get', `/playlist/${clientID}/${playlistID}?save&${playlistURI}`, true);
            xhr.responseType = 'json';
            xhr.send();
        })
        // 4. Throw an Error if there was a problem.
        .then(res => {
            if (!res) {
                throw 'Server did not response. Idk whether uploading playlist was successful or not.';
            }

            if (res.length != this.playlist[playlistID].length) {
                console.log(res, this.playlist[playlistID]);
                throw `Sent playlist doesn't match with received playlist`;
            }

            for (let i = 0; i < res.length; i++) {
                if (res[i] != this.playlist[playlistID][i]) {
                    console.log(res, this.playlist[playlistID]);
                    throw `Sent playlist doesn't match with received playlist`;
                }
            }

            console.log('Playlist successfully uploaded.');
            return res;
        })
    }

    queuePlaylist(playlistID, index, path) {
        let isPlayed = this.status.playlist == playlistID;

        // Are we editing a playlist that is being played at this moment?
        if (this.status.playlist == playlistID) {

            let currentPlayer = this.player[this.status.player],
                theOtherPlayer = this.status.player == 0 ? this.player[1] : this.player[0];

            // Play queued song right now.
            if (this.status.index == index) {
                currentPlayer.src = `/stream${path}`;
                currentPlayer.currentTime = 0;
                currentPlayer.load();
                currentPlayer.play();

                this.status.preloaded[this.status.player] = false;
            }
            // Preload queued song on demand.
            else if (this.option.preload && this.status.index + 1 == index) {
                theOtherPlayer.src = `/stream${path}`;
                theOtherPlayer.currentTime = 0;
                theOtherPlayer.load();

                let a = this.status.player == 0 ? 1 : 0;
                this.status.preloaded[a] = true;
            }
        }
        

        // Update Playlist.
        let newPlaylist = new Array();
        
        for (let i = 0; i < this.playlist[playlistID].length + 1; i++) {
            if (i == index) {
                newPlaylist.push(path);
            }
            else if (i < index) {
                newPlaylist.push(this.playlist[playlistID][i]);
            }
            else if (i > index) {
                newPlaylist.push(this.playlist[playlistID][i - 1]);
            }
        }

        this.playlist[playlistID] = newPlaylist;


        // Save playlist automatically on demand!
        if (this.option.autosave) {
            this.uploadPlaylist(playlistID);
        }
    }
}
var audio = new AudioPlayer();


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
