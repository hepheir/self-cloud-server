'use strict';

module.exports = (function() {
    let t;
    return {
        start: msg => {
            console.log(msg);
            t = Date.now();
        },
        end: msg => {
            let took = Date.now() - t;
            console.log(`${msg}\ntook ${took} ms.`)
            return took;
        }
}})()