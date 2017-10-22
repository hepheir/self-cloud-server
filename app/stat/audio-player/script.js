'use strict';

class AudioPlayer {
    constructor() {
        this.status = {
            playlist: 'default',
            index: 0,
            bufferSource: undefined,

            time: 0,

            startedAt: 0,
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

            context : new AudioContext()
        };
        this.playlist = {
            node: undefined,

            list: {
                default: new Array()
            }
        };
        this.option = {
            preload: false,
            autoplay: true,
            autosave: true,
            shuffle: false,
            loop: true,
            prevButtonToPlayAgain: 5
        };

        // Binding
            this.initialize = this.initialize.bind(this);
            this.createAudioBuffer = this.createAudioBuffer.bind(this);

            this.play = this.play.bind(this);
            this.pause = this.pause.bind(this);
            this.seekTo = this.seekTo.bind(this);

            this.addToPlaylist = this.addToPlaylist.bind(this);
            this.removeFromPlaylist = this.removeFromPlaylist.bind(this);

            this.onEnded = this.onEnded.bind(this);
            this.onPrevButtonClick = this.onPrevButtonClick.bind(this);
            this.onPlayButtonClick = this.onPlayButtonClick.bind(this);
            this.onNextButtonClick = this.onNextButtonClick.bind(this);

        this.initialize();
    }

    initialize() {
        this.downloadPlaylist('default')
            .then(playlist => playlist.forEach(path => {
                if (this.option.preload) {
                    this.createAudioBuffer(path, audioBuffer => {
                        this.playlist.list['default'].push({
                            path: path,
                            buffer: audioBuffer
                        });
                    });
                }
                else {
                    this.playlist.list['default'].push({
                        path: path,
                        buffer: undefined
                    });
                }
            }, this))
            .then(() => {
                if (this.option.autoplay)
                    this.play(0);
            })
            
        
        this.player.node.prev.addEventListener('click', this.onPrevButtonClick);
        this.player.node.play.addEventListener('click', this.onPlayButtonClick);
        this.player.node.next.addEventListener('click', this.onNextButtonClick);
    }

    createAudioBuffer(path, callback) {
        let url = '/stream' + path;
        new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open('get', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.send();
            xhr.onload = () => {
                resolve(xhr.response);
            }
        })
        .then(arrayBuffer => {
            this.player.context.decodeAudioData(arrayBuffer, decoded => {
                console.log('Successfully created Audio Buffer: ', decoded);

                callback(decoded);
            }, err => console.log(err))
        })
    }


    // Player Control
    play(index, start) {
        if (this.playlist.list[this.status.playlist].length == 0 || this.playlist.list[this.status.playlist] == undefined) {
            throw 'Empty playlist!';
        }

        // Already being played? abort that!
        if (this.status.bufferSource !== undefined) {
            this.status.bufferSource.removeEventListener('ended', this.onEnded);
            this.status.bufferSource.stop();
        }

        // If index is not defined, play what we were playing before.
        if (index === undefined) {
            index = this.status.index;
        }
        else if (index >= this.playlist.list[this.status.playlist].length) {
            if (this.option.loop) {
                index = 0;
            }
            else {
                throw 'end of the playlist!';
            }
        }

        let source = this.playlist.list[this.status.playlist][index];
        
        // Download buffer if there's no cached one.
        if (source.buffer === undefined) {

            // Loading UI
            this.player.node.playIcon.src = ICON_PATH + 'play.svg';
            this.player.node.primaryTitle.innerHTML = '로딩중...';

            source.buffer = this.createAudioBuffer(source.path, audioBuffer => {
                this.playlist.list[this.status.playlist][index].buffer = audioBuffer;

                this.play(index);
            });
            return;
        }

        
        // If the player has been paused, start playing at the point where it was paused. 
        if (this.status.time) {
            start = this.status.time;
        }
       
        // Otherwise, start from 0 sec.
        if (typeof start !== 'number' || start < 0 || this.status.index !== index) {
            start = 0;
        }

        // Create a one-time buffer source.
        let bufferSource = this.player.context.createBufferSource();

        bufferSource.buffer = source.buffer;

        bufferSource.addEventListener('ended', this.onEnded);

        bufferSource.connect(this.player.context.destination);
        bufferSource.start(0, start);


        // Update status.
        this.status.index = index;
        this.status.bufferSource = bufferSource;

        this.status.startedAt = this.player.context.currentTime - start;
        this.status.time = 0;

        // Update UI
        this.player.node.playIcon.src = ICON_PATH + 'pause.svg';
        this.player.node.primaryTitle.innerHTML = source.path.match(/[^/]+$/)[0].replace('.mp3', '');

        console.log(`playing ${index}th song.`)
    }

    pause() {
        if (this.playlist.list[this.status.playlist].length == 0 || this.playlist.list[this.status.playlist] == undefined) {
            throw 'Empty playlist!';
        }

        // Already paused?
        if (this.status.time) {
            return;
        }

        this.status.bufferSource.removeEventListener('ended', this.onEnded);
        this.status.bufferSource.stop();
        this.status.bufferSource = undefined;

        this.status.time = this.player.context.currentTime - this.status.startedAt;
        
        this.player.node.playIcon.src = ICON_PATH + 'play.svg';
    }

    seekTo(time) {
        this.status.time = time;
        this.play();
    }


    // Playlist Control
    addToPlaylist(path, playlistID, index, callback) {
        if (path === undefined) {
            throw 'Source path is required';
        }
        // If `playlistID` and `index` is not defined, use values that is currently being played.
        if (playlistID === undefined && index === undefined && callback === undefined)
        {
            playlistID = this.status.playlist;
            index = this.status.index;
        }
        else if (index === undefined && callback === undefined)
        {
            if (typeof playlistID === 'number') {
                index = playlistID;
                playlistID = this.status.playlist;
            }
            else if (typeof playlistID === 'function') {
                callback = playlistID;
                playlistID = this.status.playlist;
                index = this.status.index;
            }
            else if (this.status.playlist == playlistID) {
                index = this.status.index;
            }
            else {
                throw 'index is required to add source to another playlist.';
            }
        }
        else if (callback === undefined)
        {
            if (this.status.playlist == playlistID && typeof index === 'function') {
                callback = index;
                index = this.status.index;
            }
            else if (typeof playlistID === 'number' && typeof index === 'function') {
                callback = index;
                index = playlistID;
                playlistID = this.status.playlist;
            }
        }


        // If playlist with given id does not exists, create an empty one.
        let playlist = this.playlist.list[playlistID];

        if (playlist === undefined) {
            playlist = new Array();
        }

        if (index > playlist.length) {
            throw `Index out of range`;
        }

        // Append new source to playlist.
        for (let i = playlist.length; i > index; i--) {
            playlist[i] = playlist[i - 1];
        }
        playlist[index] = {
            path: path,
            buffer: undefined
        }

        this.playlist.list[playlistID] = playlist;
        
        // Play right now, if user wants to.
        if (playlistID === this.status.playlist && index === this.status.index) {
            this.play();
        }
        else if (this.option.preload) {
            this.createAudioBuffer(path, audioBuffer => {
                this.playlist.list[playlistID][index].buffer = audioBuffer;
                
                if (callback !== undefined) {
                    callback();
                }
            });
        }
        else if (callback !== undefined) {
            callback();
        }

        if (this.option.autosave) {
            this.uploadPlaylist(playlistID);
        }
        
        console.log('queued to playlist!');
    }

    removeFromPlaylist(playlistID, index) {
        // If `playlistID` and `index` is not defined, use values that is currently being played.
        if (playlistID === undefined) {
            playlistID = this.status.playlist;
        }
        else if (typeof playlistID === 'number' && index === undefined) {
            index = playlistID;
            playlistID = this.status.playlist;
        }

        if (index === undefined) {
            index = this.status.index;
        }

        // If removing a song curretly being played, APPLY!
        if (this.status.playlist == playlistID && this.status.index == index) {
            this.pause();
            this.status.time = 0.01;
            
            this.player.node.primaryTitle.innerHTML = '';
            this.player.node.secondaryTitle.innerHTML = '';
        }

        let playlist = this.playlist.list[playlistID];

        for (let i = index; i < playlist.length; i++) {
            playlist[i] = playlist[i + 1];
        }
        playlist.pop();

        this.playlist.list[playlistID] = playlist;
        

        if (this.option.autosave) {
            this.uploadPlaylist(playlistID);
        }
    }
    
    downloadPlaylist(playlistID) {
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
            if (res === null) {
                res = new Array();
            }
            else if (!Array.isArray(res)) {
                console.log(res);
                throw 'Unexpected response data.';
            }

            return res;
        })
    }
    
    uploadPlaylist(playlistID) {
        
        if (playlistID === undefined) {
            throw 'playlistID is not defined';
        }

        // 1. Set client ID.
        let clientID;
        if (typeof user !== undefined) { // Check if module user has loaded.
            clientID = user.id;
        }
        else {
            clientID = 'guest';
        }
        
        // 2. Prepare for AJAX request.
        let playlist = this.playlist.list[playlistID];

        let playlistURI;
        if (playlist) {
            let i = 0;
            playlistURI = playlist.map(item => `id_${i++}=${encodeURIComponent(item.path)}`).join('&');
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

            if (res.length != this.playlist.list[playlistID].length) {
                console.log(res, this.playlist.list[playlistID]);
                throw `Sent playlist doesn't match with received playlist. (length is not equal)`;
            }

            for (let i = 0; i < res.length; i++) {
                if (res[i] != this.playlist.list[playlistID][i].path) {
                    console.log(res[i], this.playlist.list[playlistID][i]);
                    throw `Sent playlist doesn't match with received playlist`;
                }
            }

            console.log('Playlist successfully uploaded.');
            return res;
        })
    }


    // Event Listners
    onEnded(evt) {
        // If autoplay option is disabled, do nothing.
        if (!this.option.autoplay) {
            return;
        }

        let queue = this.status.index + 1;

        let playlist = this.playlist.list[this.status.playlist];
        if (playlist.length <= queue && this.option.loop) {
            queue = 0;
        }

        this.play(queue);
    }
    
    onPrevButtonClick(evt) {
        // If played time is long enough, play the same song from its begging.
        let playedTime = this.player.context.currentTime - this.status.startedAt;
        if (playedTime > this.option.prevButtonToPlayAgain) {
            this.status.time = 0;
            this.play();

            return;
        }

        let queue = this.status.index - 1,
            playlist = this.playlist.list[this.status.playlist];

        // When we reach the end,
        if (queue < 0) {
            if (this.option.loop) {
                queue = playlist.length - 1;
            }
            else {
                return;
            }
        }

        this.play(queue);
    }

    onPlayButtonClick(evt) {
        let isPaused = this.status.time > 0;
        if (isPaused) {
            this.play();
        }
        else {
            this.pause();
        }
    }
    
    onNextButtonClick(evt) {
        let queue = this.status.index + 1,
            playlist = this.playlist.list[this.status.playlist];

        // When we reach the end,
        if (playlist.length <= queue) {
            if (this.option.loop) {
                queue = 0;
            }
            else {
                return;
            }
        }

        this.play(queue);
    }
}

var audio = new AudioPlayer();