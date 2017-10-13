'use strict';

const fs = require('fs');

/**
 *  PLAYLIST = {
 *      name: {
 *          playlist1 : ['src1', 'src2', ...],
 *          .
 *          .
 *          .
 *      },
 *      .
 *      .
 *      .
 *  }
 */
var PLAYLIST;

var PLAYLIST_PATH;

// Module

module.exports.setPlaylistPath = setPlaylistPath; // Initializer

module.exports.getPlaylist = getPlaylist;
module.exports.setPlaylist = setPlaylist;
module.exports.getAllPlaylists = getAllPlaylists;


// FUNCTIONS

function setPlaylistPath(path) {
    PLAYLIST_PATH = path;
    
    // If playlist.json does not exist, create one!
    if (!fs.existsSync(PLAYLIST_PATH)) {
        fs.closeSync(fs.openSync(PLAYLIST_PATH, 'w'));
        fs.writeFileSync(PLAYLIST_PATH, '{}');
    }

    PLAYLIST = JSON.parse(fs.readFileSync(PLAYLIST_PATH, 'utf8'));
}

function getPlaylist(clientID, playlistID) {
    if (!PLAYLIST[clientID]) {
        PLAYLIST[clientID] = new Object();
        return null;
    }

    if (!PLAYLIST[clientID][playlistID]) {
        return null;
    }

    return PLAYLIST[clientID][playlistID];
}

function setPlaylist(clientID, playlistID, playlist) {
    if (!PLAYLIST[clientID]) {
        PLAYLIST[clientID] = new Object();
    }

    PLAYLIST[clientId][playlistID] = playlist;

    // Update [playlist.json] asynchronously.
    new Promise((resolve, reject) => {
        fs.writeFileSync(PLAYLIST_PATH, JSON.stringify(json));
    })
}

function getAllPlaylists(clientID) {
    if (!Playlist[clientID]) {
        return null;
    }

    let userPlaylists = new Array();

    for (let playlistID in PLAYLIST) {
        userPlaylists.push(playlistID);
    }

    return userPlaylists;
}