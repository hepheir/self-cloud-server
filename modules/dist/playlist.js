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

// Path

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

/**
 * returns an Array of source paths.
 * if requested playlist doesn't exist, returns null.
 * @param {String} clientID 
 * @param {String} playlistID 
 * @return {Array|null}
 */
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

/**
 * Sets a playlist with given id and list
 * @param {String} clientID 
 * @param {String} playlistID 
 * @param {Array} playlist 
 */
function setPlaylist(clientID, playlistID, playlist) {
    if (!PLAYLIST[clientID]) {
        PLAYLIST[clientID] = new Object();
    }

    PLAYLIST[clientID][playlistID] = playlist;

    // Update [playlist.json] asynchronously.
    new Promise((resolve, reject) => {
        fs.writeFileSync(PLAYLIST_PATH, JSON.stringify(PLAYLIST));
    })
}

/**
 * returns an Array of user's playlists.
 * if requested playlist doesn't exist, returns null.
 * @param {String} clientID
 * @return {Array|null}
 */
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