'use strict';

class AudioPlayer {
    constructor() {
        this.status = {
            playlist: 'default',
            index: 0,

            bufferSource: undefined,

            currentTime: 0,
            paused: true,

            shuffledList: new Array()
        };
        
        this.playlist = {
            default: new Array()
        };
        
        this.cache = new Object();
          
        this.player = new AudioContext();

        this.option = {
            preload: false,
            autosave: true,
            autoplay: true,
            loop: true,
            shuffle: false,
            prevActive: 5,
            timerPeriod: 10
        };

        this.node = {
            primaryTitle: document.getElementById('audio-primary-title'),
            secondaryTitle: document.getElementById('audio-secondary-title'),

            prev: document.getElementById('audio-prev'),

            play: document.getElementById('audio-play'),
            playIcon: document.getElementById('audio-play-icon'),

            next: document.getElementById('audio-next')
        };

        // Binding
            this.initialize = this.initialize.bind(this);
            this.createCache = this.createCache.bind(this);

            // Player
            this.play = this.play.bind(this);
            this.pause = this.pause.bind(this);
            this.stop = this.stop.bind(this);
            this.seekTo = this.seekTo.bind(this);

            // Playlist
            this.addToPlaylist = this.addToPlaylist.bind(this);
            this.removeFromPlaylist = this.removeFromPlaylist.bind(this);

            // Event Listeners
            this.onEnded = this.onEnded.bind(this);
            this.onPrevButtonClick = this.onPrevButtonClick.bind(this);
            this.onPlayButtonClick = this.onPlayButtonClick.bind(this);
            this.onNextButtonClick = this.onNextButtonClick.bind(this);

            // UI
            this.setTitle = this.setTitle.bind(this);

            // Helper
            this._optIndex = this._optIndex.bind(this);
            this._getString = this._getString.bind(this);
            this._timer = this._timer.bind(this);


        this.initialize();
    }

    initialize() {
        this.status.playlist = this._isDefined(localStorage.getItem('playlist'), 'default');
        this.status.index    = this._isDefined(localStorage.getItem('index'), 0);

        this.downloadPlaylist(this.status.playlist)
            .then(playlist => {
                this.playlist[this.status.playlist] = playlist;
            })
            .then(() => {
                console.log(`initialize with playlist: [${this.status.playlist}], index: ${this.status.index}`);

                if (this.option.autoplay)
                    this.play(this.status.index);
            })
            
        
        this.node.prev.addEventListener('click', this.onPrevButtonClick);
        this.node.play.addEventListener('click', this.onPlayButtonClick);
        this.node.next.addEventListener('click', this.onNextButtonClick);


        // Start Timer
        window.setInterval(this._timer, this.option.timerPeriod);
    }

    
    // Player

    play(index) {
        index = this._isDefined(index, this.status.index);
        index = this._optIndex(index);

        this.status.index = index;

        
        // Empty playlist?
        let playlist = this.playlist[this.status.playlist];
        if (playlist.length == 0 || playlist == undefined) {
            this.setTitle('빈 재생목록', '재생할 곡이 없습니다.');
            this.stop();

            throw 'Empty playlist!'
        };

        // Already being played? abort that!
        if (this.status.bufferSource !== undefined) {
            this.stop();
        }

        let path = playlist[index];

        // Is there a cached audio buffer to play with?
        let isCached = this.cache[path] !== undefined && this.cache[path].audioBuffer !== undefined;
        if (!isCached) {
            this.setTitle('로딩중...', `[${index + 1}/${playlist.length}] 기다려주세요`);
            this.createCache(path, () => {
                if (this.status.index == index)
                    this.play();
            })
            return;
        }

        // Play the song.
        let bufferSource = this.player.createBufferSource();
        
        bufferSource.buffer = this.cache[path].audioBuffer;
        
        bufferSource.addEventListener('ended', this.onEnded);
        
        bufferSource.connect(this.player.destination);
        bufferSource.start(0, this.status.currentTime);

        // Update Status
        this.status.bufferSource = bufferSource;
        this.status.paused = false;

        localStorage.setItem('playlist', this.status.playlist);
        localStorage.setItem('index', this.status.index);
        
        // Update UI
        this.node.playIcon.src = ICON_PATH + 'pause.svg';
        
        let duration = this._durationParser(this.cache[path].audioBuffer.duration);

        let title = this.cache[path].tags.title,
            artist = `[${index + 1}/${playlist.length}] ${this.cache[path].tags.artist} (0:00/${duration})`;

        this.setTitle(title, artist);
    }

    stop() {
        if (this.status.bufferSource === undefined) {
            console.log('nothing to stop.');
        }
        else {
            let bufferSrc = this.status.bufferSource;
            this.status.bufferSource = undefined;
            
            bufferSrc.removeEventListener('ended', this.onEnded);
            bufferSrc.stop();
        }

        this.status.paused = true;
        this.status.currentTime = 0;

        // Update UI
        this.node.playIcon.src = ICON_PATH + 'play.svg';
    }

    pause() {
        if (this.status.bufferSource === undefined) {
            console.log('nothing to pause.');
        }
        else {
            let bufferSrc = this.status.bufferSource;
            this.status.bufferSource = undefined;
            
            bufferSrc.removeEventListener('ended', this.onEnded);
            bufferSrc.stop();
            
        }

        this.status.paused = true;
        
        // Update UI
        this.node.playIcon.src = ICON_PATH + 'play.svg';
    }

    seekTo(time) {
        this.stop();
        this.status.currentTime = time;
        this.play();
    }


    // Playlist

    addToPlaylist(path, playlistID, index, callback) {
        if (path === undefined) throw 'path is required.';

        playlistID = this._isDefined(playlistID, this.status.playlist);

        index = this._isDefined(index, this.status.index);
        index = this._optIndex(index);


        // If playlist with given id does not exists, create an empty one.
        let playlist = this.playlist[playlistID];

        if (playlist === undefined)
            playlist = new Array();


        // Append new source to playlist.
        for (let i = playlist.length; i > index; i--) {
            playlist[i] = playlist[i - 1];
        }
        playlist[index] = path;

        // Current playing song will be shifted +1.
        if (index <= this.status.index)
            this.status.index++;


        this.playlist[playlistID] = playlist;

        // Save playlist if user want.
        if (this.option.autosave)
            this.uploadPlaylist(playlistID);
        
        if (this.option.preload)
            this.createCache(path, () => {
                if (callback !== undefined)
                    callback();
            });
        else if (callback !== undefined)
            callback();
        
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
            
            // Update UI
            this.node.primaryTitle.innerHTML = '재생중인 곡 없음';
            this.node.secondaryTitle.innerHTML = '노래를 선택해 주세요';
        }

        let playlist = this.playlist[playlistID];

        for (let i = index; i < playlist.length; i++) {
            playlist[i] = playlist[i + 1];
        }
        playlist.pop();

        this.playlist[playlistID] = playlist;
        

        if (this.option.autosave) {
            this.uploadPlaylist(playlistID);
        }
    }


    // Source / Ajax

    createCache(path, callback) {
        if (path === undefined)
            throw `path is required`;


        if (this.cache[path] !== undefined) {
            if (this.cache[path].audioBuffer !== undefined) {
                console.log('Audio Buffer already exists.');
                return;
            }
            else {
                this.cache[path].onload = callback;
                console.log('Overwrote onload callback function.');
                return;
            }
        }

        // 1. Request server an array buffer of an audio file.
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
        // 2. Check valid data came from server & create an empty cache object.
        .then(arrayBuffer => {
            if (arrayBuffer == undefined)
                throw 'No responsed data.';


            this.cache[path] = {
                audioBuffer: undefined,
                tag: undefined,
                onload: callback
            }

            return arrayBuffer;
        })
        // 3. Cache tags.
        .then(arrayBuffer => {
            let encoding = 'ISO-8859-1';
            // Thanks alot jDataView! - hepheir.
            
            var dv = new DataView(arrayBuffer);

            let tagString = this._getString(arrayBuffer, 128, dv.byteLength - 128, 'ISO-8859-1');

            // If Korean is used in tags...
            if (tagString.match(/[^a-zA-Z0-9]+/) !== null) {
                encoding = 'EUC-KR';
                tagString = this._getString(arrayBuffer, 128, dv.byteLength - 128, encoding);
            }
            
            let tags = new Object();

            // "TAG" starts at byte -128 from EOF.
            // See http://en.wikipedia.org/wiki/ID3
            if (tagString.startsWith('TAG')) {
                let tagLength = {
                    tag: 3,
                    title: 30,
                    artist: 30,
                    album: 30,
                    year: 4
                }
                let offset = 0;
                
                for (let tagName in tagLength) {
                    let byteLength = dv.byteLength - 128 + offset;

                    tags[tagName] = this._getString(arrayBuffer, tagLength[tagName], byteLength, encoding);
                    offset += tagLength[tagName];
                }

                delete tags.tag;
                console.log('Successfully read tags: ', tags);

            } else {
                tags = {
                    title : path.match(/[^/]+$/)[0].replace('.mp3', ''), // file name.
                    artist: 'no artist data'
                };

                console.log('no ID3v1 data found.');
            }

            this.cache[path].tags = tags;

            return arrayBuffer;
        })
        // 4. Cache Audio Buffer
        .then(arrayBuffer => {
            this.player.decodeAudioData(arrayBuffer, audioBuffer => {
                this.cache[path].audioBuffer = audioBuffer;

                console.log('Successfully created Audio Buffer: ', audioBuffer);

                if (this.cache[path].onload !== undefined) {
                    this.cache[path].onload();
                    this.cache[path].onload = undefined;
                }

            }, err => console.log(err))
        })
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

        // 2. URI encode.
        clientID = encodeURIComponent(clientID);
        playlistID = encodeURIComponent(playlistID);

        // 3. Request playlist data from server.
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
        // 4. Sync local playlist with received playlist.
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
        let playlist = this.playlist[playlistID];

        let playlistURI;
        if (playlist) {
            let i = 0;
            playlistURI = playlist.map(path => `id_${i++}=${encodeURIComponent(path)}`).join('&');
        }
        else {
            playlistURI = '';
        }

        // 2-1. URI encode.
        clientID = encodeURIComponent(clientID);
        playlistID = encodeURIComponent(playlistID);

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

            if (res.length != playlist.length) {
                console.log(res, playlist);
                throw `Sent playlist doesn't match with received playlist. (length is not equal)`;
            }

            for (let i = 0; i < res.length; i++) {
                if (res[i] != playlist[i]) {
                    console.log(res[i], playlist[i]);
                    throw `Sent playlist doesn't match with received playlist`;
                }
            }

            console.log('Playlist successfully uploaded.');
            return res;
        })
    }
    
    // UI

    setTitle(primary, secondary) {
        primary = this._isDefined(primary, '');
        secondary = this._isDefined(secondary, '');

        this.node.primaryTitle.innerHTML = primary;
        this.node.secondaryTitle.innerHTML = secondary;
    }


    // Helper
    
    _optIndex(index, playlistID) {
        index = this._isDefined(index, this.status.index);
        playlistID = this._isDefined(playlistID, this.status.playlist);

        index = parseInt(index);
        let playlist = this.playlist[playlistID];

        if (index < playlist.length && index >= 0) {
            return index;
        }

        if (this.option.loop) {
            if (index < 0)
                return playlist.length - 1;

            else
                return 0;
        }
        
        throw 'end of the playlist!';
    }
    
    _isDefined(value, defaultValue) {
        return value === undefined || value === '' || value === null ? defaultValue : value;
    }

    _getString(arrayBuffer, length, byteOffset, encoding) {
        encoding = this._isDefined(encoding, 'utf-8');

        let bytes = new Uint8Array(arrayBuffer, byteOffset, length);
        return new TextDecoder(encoding).decode(bytes);
    }

    _timer() {
        if (this.status.paused)
            return;
        
        this.status.currentTime = Math.round(this.status.currentTime * 1000 / this.option.timerPeriod + 1) * this.option.timerPeriod / 1000;
        

        let playlist = this.playlist[this.status.playlist],
            index = this.status.index;

        let path = playlist[index];

        let duration = this._durationParser(this.cache[path].audioBuffer.duration),
            current = this._durationParser(this.status.currentTime);
        
        let title = this.cache[path].tags.title,
            artist = `[${index + 1}/${playlist.length}] ${this.cache[path].tags.artist} (${current}/${duration})`;

        this.setTitle(title, artist);
    }

    _durationParser(seconds) {
        let min = Math.floor(seconds / 60);
        let sec = Math.floor(seconds - min * 60);

        if (sec < 10) {
            sec = '0' + sec;
        }

        return `${min}:${sec}`;
    }


    // Event Listners
    onEnded(evt) {
        // If autoplay option is disabled, do nothing.
        if (!this.option.autoplay) {
            return;
        }

        let queue = this.optIndex(this.status.index + 1);

        this.play(queue);
    }
    
    onPrevButtonClick(evt) {
        this.pause();

        let isPrevActive = this.status.currentTime > this.option.prevActive;

        this.status.currentTime = 0;

        // If played time is long enough, play the same song from its begging.
        if (isPrevActive) {
            this.play();
            return;
        }

        this.play(this.status.index - 1);
    }

    onPlayButtonClick(evt) {
        let isPaused = this.status.bufferSource === undefined;
        if (isPaused) 
            this.play();
        else
            this.pause();
    }
    
    onNextButtonClick(evt) {
        this.stop();
        this.play(this.status.index + 1);
    }
}

var audio = new AudioPlayer();



// lab

audio.node.primaryTitle.addEventListener('click', a);
audio.node.secondaryTitle.addEventListener('click', a);

function a(evt) {
	if (audio !== undefined) {
		let msg = `현재 재생목록: ${audio.status.playlist}\n\n`, i = 0;

		audio.playlist[audio.status.playlist].forEach(path => {
			let filename = path.match(/[^/]+$/)[0].replace('.mp3', '');

			if (i == audio.status.index) {
				msg += `${i} >> [${filename}]\n`;
			} else {
				msg += `${i} [${filename}]\n`;
			}
			i++;
		});

		msg += '\n현재 재생중인 곡을 재생목록에서 삭제합니까?'

		if (confirm(msg)) {
			audio.removeFromPlaylist();
		}
	}
}

document.addEventListener('keypress', evt => {
	if (evt.keyCode == 32) {
		audio.onPlayButtonClick();
	}
})