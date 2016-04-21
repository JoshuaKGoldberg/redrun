#!/usr/bin/env node

'use strict';

let path        = require('path');
let spawnify    = require('spawnify');
let tryCatch    = require('try-catch');
let redrun      = require('..');
let cwd         = process.cwd();
let argv        = process.argv;
let args        = require('minimist')(argv.slice(2), {
    alias: {
        p: 'parallel',
        h: 'help',
        v: 'version'
    },
    
    unknown: function(cmd) {
        let name = getInfo('..').name;
        
        if (/^--?/.test(cmd)) {
            console.error(
                '\'%s\' is not a ' +  name + ' option. ' +
                'See \'' + name + ' --help\'.', cmd
            );
          
            process.exit(-1);
        }
    }
});

if (args.version)
    version();
else if (args.help || !args._.length)
    help();
else if (args.parallel)
    args._.forEach((name) => {
        exec(redrun(name, getInfo(cwd)));
    });
else
    exec(series(args._, getInfo(cwd)))

function series(names, scripts) {
    let all = names.map((name) => {
        return redrun(name, scripts);
    });
    
    return all.join(' && ');
}

function exec(cmd) {
    let child = spawnify(cmd);
    
    console.log(`redrun: ${cmd}`);
    
    child.on('data', (data) => {
        process.stdout.write(data);
    });
    
    child.on('error', (error) => {
        process.stderr.write(error);
    });
}

function getInfo(dir) {
    let info;
    let infoPath     = path.join(dir, 'package.json');
    let error       = tryCatch(() => {
        info = require(infoPath);
    });
    
    if (error) {
        console.error(error.message);
        process.exit(1);
    }
    
    return info;
}

function version() {
    console.log('v' + getInfo('..').version);
}

function help() {
    var bin         = require('../help'),
        usage       = 'Usage: ' + getInfo('..').name + ' [script1 script2 ... scriptN]';
        
    console.log(usage);
    console.log('Options:');
    
    Object.keys(bin).forEach(function(name) {
        var line = '  ' + name + ' ' + bin[name];
        console.log(line);
    });
}
