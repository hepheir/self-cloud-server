
class AudioPlayer {
    constructor()
    {
        this.player = new AudioContext();

        this.playlist = new Array();
        
        this.bufferSource;
        this.bufferStartTime;

        this.cache = new Object();

        // Usable function.
        this.play = this.play.bind(this);
        this.pause = this.pause.bind(this);
        this.stop = this.stop.bind(this);
        this.seekTo = this.seekTo.bind(this);
        this.next = this.next.bind(this);

        this.addQueue = this.addQueue.bind(this);

        // Helpers
        this._play = this._play.bind(this);
        this._pause = this._pause.bind(this);
        this._stop = this._stop.bind(this);
        this._seekTo = this._seekTo.bind(this);

        this._onEnded = this._onEnded.bind(this);
        this._addQueue = this._addQueue.bind(this);
        this._addStack = this._addStack.bind(this);

        this._createCache = this._createCache.bind(this);
        this._xhr = this._xhr.bind(this);
    }

    // Usable Functions.

    play(url, start, end)
    {
        let current = this.playlist[0];

        if (url == undefined)
        {
            url = current.url;

            start = current.start;
            end = current.end;
        }
        else if (url != current.url)
        {
            this._addStack(url, start, end);
        }

        this._play(url, start, end);
    }

    pause() {
        this._pause();
    }

    stop() {
        this._stop();
    }

    seekTo(time) {
        this._seekTo(time);
    }

    next() {
        this._stop();
        this._onEnded();
    }

    addQueue(url, start, end)
    {
        this._addQueue(url, start, end);

        if (this.playlist.length == 1)
            this._play(url, start, end);

        else if (this.playlist.length == 2 && this.cache[url] == null) {
            this._createCache(url);
        }
    }

    // Helpers

    _play(url, start, end)
    {
        start = start == undefined ? 0 : start;
        end = end == undefined ? 86400 : end;

        try { this._stop() } catch (e) {}

        if (start > end) {
            console.log(`Cannot play audio for negative seconds - Start: ${start}, End: ${end}`)
        }

        // If not cached, cache anew.
        if (this.cache[url] == null) {
            this._createCache(url).then(
                () => this._play(url, start, end),
                err => console.log(`Cannot download file - Url [${url}]`)
            );
            return;
        }

        
        // Create a one-time buffer source.
        this.bufferSource = this.player.createBufferSource();

        this.bufferSource.addEventListener('ended', this._onEnded);
        this.bufferSource.addEventListener('statechange', this._onStatechange);
    
        this.bufferSource.buffer = this.cache[url].audioBuffer;

        this.bufferSource.connect(this.player.destination);
        this.bufferSource.start(0, start, end - start);

        this.bufferStartTime = this.player.currentTime - start;
    }

    _pause() {
        this.playlist[0].start = this.player.currentTime - this.bufferStartTime;
        this.stop();
    }

    _stop() {
        this.bufferSource.removeEventListener('ended', this._onEnded);
        this.bufferSource.stop();
    }

    _seekTo(time)
    {
        let current = this.playlist[0];
        
        if (current.end != undefined && current.end < time)
        {
            current.end = undefined;
        }

        this._play(current.url, time, current.end);
    }

    _onEnded() {
        this.playlist.shift();

        let current = this.playlist[0];

        if (current != undefined)
            this._play(current.url, current.start, current.end);


        // Prepare for the next song.
        let standby = this.playlist[1];

        if (standby != undefined && this.cache[standby.url] == null)
            this._createCache(standby.url);
    }

    _addStack(url, start, end)
    {
        this.playlist.unshift({
            url: url,
            start: start,
            end: end
        });
    }

    _addQueue(url, start, end)
    {
        this.playlist.push({
            url: url,
            start: start,
            end: end
        });
    }

    _createCache(url)
    {
        let xhr = this._xhr();

        return new Promise((resolve, reject) => {
            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4)
                {
                    if (xhr.status == 200) {
                        resolve(xhr.response);
                    }
                    else {
                        reject(xhr.status);
                    }
                }
            };
    
            xhr.responseType = 'arraybuffer';
            xhr.open("GET", url, true);
            xhr.send();
        })
        .then(
            arrayBuffer => new Promise((resolve, reject) => {
                this.player.decodeAudioData(arrayBuffer,
                    audioBuffer => {
                        this.cache[url] = new Object();
                        this.cache[url].audioBuffer = audioBuffer;
    
                        console.log(`Successfully created AudioBuffer: `, audioBuffer);

                        resolve();
                    },
                    err => reject(err)
                );
            }),
            errStatus => {
                switch (errStatus) {
                    case 404:
                        console.log('File not found.', errStatus);
                        break;
                
                    default:
                        console.log('Unexpected Error.\nFailed to create AudioBuffer.');
                        break;
                }
                throw errStatus;
            }
        )
    }

    _xhr() {
        return new XMLHttpRequest();
    }
}

var audio = new AudioPlayer();




// TEST - Predefined Playlist


let list = [
    {
        url: `${location.origin}/stream/1) Music/11) 멜론 구매곡/17-12, 18-1 D/자우림-04-낙화(落花).mp3`,
        start: 85.8,
        end: 112.4
    },
    {
        url: `${location.origin}/stream/1) Music/11) 멜론 구매곡/17-12, 18-1 D/중식이-01-Sunday Seoul.mp3`,
        start: 65.8,
        end: 92.7
    },
    {
        url: `${location.origin}/stream/1) Music/11) 멜론 구매곡/17-12, 18-1 D/David Guetta-10-Hey Mama (Feat. Nicki Minaj, Bebe Rexha & Afrojack).mp3`,
        start: 34,
        end: 67
    },
    {
        url: `${location.origin}/stream/1) Music/11) 멜론 구매곡/17-12, 18-1 D/Charlie Puth-10-Suffer.mp3`,
        start: 48.9,
        end: 74.2
    }
];

list.forEach(q => audio.addQueue(q.url, q.start, q.end));
audio.play();

function stop() {
    audio.playlist = new Array();
    audio.stop();
}