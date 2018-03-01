// const http = require('http');

// const hostname = '127.0.0.1';
// const port = 3000;

// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end('Hello World\n');
// });

// server.listen(port, hostname, () => {
//   console.log(`Server running at http://${hostname}:${port}/`);
// });


const fs = require('fs');

let audioFile = fs.readFileSync('./audio.mp3');

var arrayBuffer = new Uint8Array(audioFile);

// If ID3v1

let AudioTags = new Object();

var ID3v1Format = {
    header: 3,
    title: 30,
    artist: 30,
    album: 30,
    year: 4,
    comment: 28,
    zeroByte: 1,
    track: 1,
    genre: 1
}

let ID3v1Tags = new Uint8Array(128);

for (let i = 0; i < 128; i++) {
    ID3v1Tags[i] = arrayBuffer[arrayBuffer.byteLength - 128 + i];
}

let tagOffset = 0;

for (tag in ID3v1Format) {
    AudioTags[tag] = new String();
    
    for (let t = 0; t < ID3v1Format[tag]; t++) {
        if (String.fromCharCode(ID3v1Tags[t + tagOffset]) === '\u0000') {
            continue;
        }

        AudioTags[tag] += String.fromCharCode(ID3v1Tags[t + tagOffset]);
    }

    tagOffset += ID3v1Format[tag];
}

console.log(AudioTags);