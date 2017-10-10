'use strict';

module.exports = (function() {
    let t;
    return {
        start: msg => {
            console.log(msg);
            t = Date.now();
        },
        end: msg => console.log(`${msg}\ntook ${Date.now() - t} ms.`)
}})()