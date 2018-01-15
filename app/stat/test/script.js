
class AudioPlayer {
    constructor() {
        this.player = new AudioContext();
        this.bufferSource;

        this.cache = new Object();

        this.play = this.play.bind(this);
        this.stop = this.stop.bind(this);

        this.createCache = this.createCache.bind(this);
        this.xhr = this.xhr.bind(this);
    }

    play(url) {
        // If not cached, cache anew.
        if (this.cache[url] == null) {
            this.createCache(url).then(
                () => this.play(url),
                err => console.log(`Playing quene canceled - Url [${url}]`)
            );
            return;
        }

        
        // Create a one-time buffer source.
        this.bufferSource = this.player.createBufferSource();
    
        this.bufferSource.buffer = this.cache[url].audioBuffer;

        this.bufferSource.connect(this.player.destination);
        this.bufferSource.start(0, 0);
    }

    stop() {
        this.bufferSource.stop();
    }


    createCache(url) {
        let xhr = this.xhr();

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

    xhr() {
        return new XMLHttpRequest();
    }
}

var audio = new AudioPlayer();