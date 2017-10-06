'use strict';

const fs = require('fs');

const PLAYLIST_PATH = 'playlist.json';

var PLAYLIST;

if (!fs.existsSync(PLAYLIST_PATH)) {
    fs.closeSync(fs.openSync(PLAYLIST_PATH, 'w'));
    fs.writeFileSync(PLAYLIST_PATH, '{}');
}

loadPlaylist();

// FUNCTIONS

function savePlaylist(json) {
    fs.writeFileSync(PLAYLIST_PATH, JSON.stringify(json));
}

function loadPlaylist(json) {
    PLAYLIST = JSON.parse(fs.readFileSync(PLAYLIST_PATH, 'utf8'));
}

/**
 * 
 * @param {string} client 
 * @param {[String]} playlist 
 */
function addPlaylist(client, playlist) {
    PLAYLIST[client] = playlist;

    savePlaylist(PLAYLIST);
}

function getPlaylist(client) {
    console.log(`\nfrom playlist.js: ${JSON.stringify(PLAYLIST)}\n`);
    if (!PLAYLIST[client]) {
        return null;
    }

    return PLAYLIST[client];
}

// Module

module.exports.addPlaylist = addPlaylist;
module.exports.getPlaylist = getPlaylist;