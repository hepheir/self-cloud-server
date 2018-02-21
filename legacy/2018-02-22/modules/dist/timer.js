'use strict';

var startTime;

// Module

module.exports.start = start;
module.exports.end = end;


// FUNCTIONS

/**
 * prints the message and start recording time.
 * @param {String} message 
 */
function start(message) {
    console.log(message);
    startTime = Date.now();
}

/**
 * prints the message with the spent time.
 * returns the spent time in miliseconds.
 * @param {String} message 
 * @return {Number}
 */
function end(message) {
    let time = Date.now() - startTime;
    console.log(`${message}\ntook ${time} ms.`)

    return time;
}