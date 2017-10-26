'use strict';

class AudioPlayer {
    constructor() {
        this.status = {
            playlist: 'default',
            index: 0,

            bufferSource: undefined,
            pausedAt: undefined,

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
            prevActive: 5
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
            this.optIndex = this.optIndex.bind(this);

            this.play = this.play.bind(this);
            this.pause = this.pause.bind(this);
            this.seekTo = this.seekTo.bind(this);

            this.addToPlaylist = this.addToPlaylist.bind(this);
            this.removeFromPlaylist = this.removeFromPlaylist.bind(this);

            this.onEnded = this.onEnded.bind(this);
            this.onPrevButtonClick = this.onPrevButtonClick.bind(this);
            this.onPlayButtonClick = this.onPlayButtonClick.bind(this);
            this.onNextButtonClick = this.onNextButtonClick.bind(this);

            // UI
            this.setTitle = this.setTitle.bind(this);
            // Helper
            this._optIndex = this._optIndex.bind(this);


        this.initialize();
    }

    initialize() {
        this.downloadPlaylist('default')
            .then(playlist => {
                this.playlist['default'] = playlist;
            })
            .then(() => {
                if (this.option.autoplay) {
                    let queue = localStorage.getItem('lastPlayed');
                    if (queue == undefined) {
                        queue = 0;
                    }
                    this.status.index = queue;
                    this.play(queue);

                }
            })
            
        
        this.node.prev.addEventListener('click', this.onPrevButtonClick);
        this.node.play.addEventListener('click', this.onPlayButtonClick);
        this.node.next.addEventListener('click', this.onNextButtonClick);
    }

    // Player

    play(index) {
        index = _isDefined(index, this.status.index);
        this.status.index = this._optIndex(index);
        
        // Empty playlist?
        let playlist = this.playlist[this.status.playlist];
        if (playlist.length == 0 || playlist == undefined) {
            this.setTitle('빈 재생목록', '재생할 곡이 없습니다.');

            throw 'Empty playlist!'
        };

        // Already being played? abort that!
        if (this.status.bufferSource !== undefined) {
            this.stop();
        }

        let path = playlist[index];

        // Is there a cached audio buffer to play with?
        let isCached = this.cache[path].audioBuffer !== undefined;
        if (!isCached) {
            this.setTitle('로딩중...', '기다려주세요');
            this.createCache(path, function() {
                if (this.status.index == index)
                    this.play();
            })
            return;
        }

        // Has paused?
        let pausedAt = this._isDefined(this.status.pausedAt, 0);
        this.status.pausedAt = 0;


        // Play the song.
        let bufferSource = this.player.createBufferSource();
        
        bufferSource.buffer = this.cache[path].audioBuffer;
        
        bufferSource.addEventListener('ended', this.onEnded);
        
        bufferSource.connect(this.player.destination);
        bufferSource.start(0, pausedAt);

        bufferSource.startedAt = this.player.currentTime - pausedAt;

        
        this.status.bufferSource = bufferSource;
        
        // Update UI
        this.node.playIcon.src = ICON_PATH + 'pause.svg';
        
        let title = this.cache[path].tags.title,
            artist = this.cache[path].tags.artist;
            
        this.setTitle(title, artist);
        
        console.log(`playing ${index}th song from ${pausedAt}.`);
    }

    stop() {
        if (this.status.bufferSource === undefined) {
            throw 'nothing to stop.';
        }

        let bufferSrc = this.status.bufferSource;

        this.status.bufferSource = undefined;
        
        bufferSrc.removeEventListener('ended', this.onEnded);
        bufferSrc.stop();

        this.node.playIcon.src = ICON_PATH + 'play.svg';
    }

    pause() {
        if (this.status.bufferSource === undefined) {
            throw 'nothing to pause.';
        }

        this.status.pausedAt = this.player.currentTime - this.status.bufferSource.startedAt;
        this.stop();
    }

    seekTo(time) {
        this.status.pausedAt = time;
        this.stop();
        this.play();
    }

    // Playlist


    // UI

    setTitle(primary, secondary) {
        primary = this._isDefined(primary, '');
        secondary = this._isDefined(secondary, '');

        this.node.primaryTitle.innerHTML = primary;
        this.node.secondaryTitle.innerHTML = secondary;
    }


    // Helper
    
    _optIndex(index, playlistID) {
        index = _isDefined(index, this.status.index);
        playlistID = _isDefined(playlistID, this.status.playlist);

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
        return value === undefined ? defaultValue : value;
    }

    createCache(path, callback) {
        if (path == undefined) {
            throw `path is required`;
        }

        if (this.cache[path] !== undefined) {
            console.log('Audio Buffer already exists.');
            return;
        }

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
            this.cache[path] = new Object();

            this.cache[path].isloading = true;

            return arrayBuffer;
        })
        // Cache tags.
        .then(arrayBuffer => {
            // Thanks alot jDataView! - hepheir.
            function getString(length, byteOffset, encoding) {
                encoding = encoding === undefined ? 'utf-8' : encoding;

                let bytes = new Uint8Array(arrayBuffer, byteOffset, length);

                return new TextDecoder(encoding).decode(bytes);
            }

            var dv = new DataView(arrayBuffer);
            
            let tagString = getString(128, dv.byteLength - 128, 'ISO-8859-1');

            let encoding = 'ISO-8859-1';

            if (tagString.match(/[^a-zA-Z0-9]+/) !== null) {
                encoding = 'EUC-KR';
                tagString = getString(128, dv.byteLength - 128, encoding);
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
                for (let key in tagLength) {
                    tags[key] = getString(tagLength[key], dv.byteLength - 128 + offset, encoding).toString('utf-8');

                    offset += tagLength[key];

                    tags[key] = tags[key] == '' ? key[0].toUpperCase() + key.slice(1) : tags[key];

                    console.log(tags[key]);
                }
                console.log(tagString.toString('utf-8'), tags);

            } else {
                console.log('no ID3v1 data found.');
                tags = {
                    title : path.match(/[^/]+$/)[0].replace('.mp3', ''),
                    artist: 'Artist'
                };
            }
            this.cache[path].tags = tags;

            return arrayBuffer;
        })
        // Cache Audio Buffer
        .then(arrayBuffer => {
            this.player.decodeAudioData(arrayBuffer, audioBuffer => {
                this.cache[path].audioBuffer = audioBuffer;

                console.log('Successfully created Audio Buffer: ', audioBuffer);

                if (callback !== undefined) {
                    callback()
                }
            }, err => console.log(err))
        })
        .then(() => {
            this.cache[path].isloading = false;
        })
    }



    // Playlist Control
    addToPlaylist(path, playlistID, index, callback) {
        // If playlist with given id does not exists, create an empty one.
        let playlist = this.playlist[playlistID];

        if (playlist === undefined) {
            playlist = new Array();
        }

        index = this.optIndex(index);

        // Append new source to playlist.
        for (let i = playlist.length; i > index; i--) {
            playlist[i] = playlist[i - 1];
        }
        playlist[index] = path;

        // Current playing song will be shifted +1.
        if (index <= this.status.index) {
            this.status.index++;
        }

        this.playlist[playlistID] = playlist;
        
        // Save playlist if user want.
        if (this.option.autosave) this.uploadPlaylist(playlistID);
        
        if (this.option.preload) this.createCache(path, () => { if (callback !== undefined) callback() });
        else if (callback !== undefined) callback();
        
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
        // If played time is long enough, play the same song from its begging.
        let playedTime = this.player.currentTime - this.status.startedAt;
        if (playedTime > this.option.prevButtonToPlayAgain) {
            this.status.time = 0;
            this.play();

            return;
        }

        let queue = this.optIndex(this.status.index - 1);
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
        let queue = this.optIndex(this.status.index + 1);
        this.play(queue);
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
				msg += `${i} >> [${filename}]\n\n`;
			} else {
				msg += `${i} [${filename}]\n\n`;
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