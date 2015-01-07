"use strict";

var fs = require('fs');

// Read in env vars when running tests
fs.readdirSync(__dirname + "/env").forEach(function (file) {
    if (/^\./.test(file)) return;
    if (!process.env[file]) {
        console.log("Setting: " + file);
        process.env[file] = fs.readFileSync(__dirname + "/env/" + file, "UTF-8").replace(/\n[\s\S]*/, '');
    }
});

require('./app');
