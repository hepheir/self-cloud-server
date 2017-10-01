'use strict';

const fs = require('fs');

// MODULE
module.exports = _constructor();
module.exports.createFileSync = _createFileSync;


function _constructor() {
    class Chain {
        constructor() {
            this.then = this.then.bind(this);
            this.proceed = this.proceed.bind(this);
            this.stop = this.stop.bind(this);
    
            this.isPending = true;
            this.pass = undefined;
    
            this.then();
        }
    
        then(executor) {
            if (this.isPending && executor) {
                let that = this;
                executor.apply(this, [that.proceed, that.stop, that.pass]);
            }
    
            return {then: this.then};
        }
    
        proceed(value) {
            this.pass = value;
        }
    
        stop() {
            this.isPending = false;
        }
    }
    
    return new Object();
}

function _createFileSync(path) {
    fs.closeSync(fs.openSync(path, 'w'));
}
