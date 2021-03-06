'use strict';

const ERROR = 'Too deep traverse. Consider reduce scripts deepness.';

const currify = require('currify/legacy');
const log = require('debug')('redrun:redrun');

const getBody = require('./get-body');
const cliParse = require('./cli-parse');
const replace = require('./replace');
const regexp = require('./regexp');

const RegExpEnter = regexp.enter;

module.exports  = (name, options, scripts) => {
    if (!scripts) {
        scripts = options;
        options = {};
    }
    
    check(name, options, scripts);
    
    return parse(name, options, scripts);
};

function check(name, options, scripts) {
    if (typeof name !== 'string')
        throw Error('name should be string!');
    
    if (!name)
        throw Error('name should not be empty!');
    
    if (typeof scripts !== 'object')
        throw Error('json should be object!');
}

function parse(name, options, scripts) {
    let i = process.env.REDRUN_DEEP || 1000;
    let body = getBody(name, options, scripts);
    
    const expandFn = currify(expand, scripts);
    
    while (RegExpEnter.test(body)) {
        log(`parse: ${i}`);
        
        if (i)
            --i;
        else
            throw Error(ERROR);
        
        body = replace(body, expandFn);
        
        if (~body.indexOf('not a redrun option'))
            break;
    }
    
    log('parse end');
    
    return body;
}

function expand(scripts, type, str) {
    let result;
    
    switch(type) {
    case 'npm':
        result = getBody(str, scripts);
        break;
    case 'redrun':
        result = redrunParse(str, scripts);
        break;
    }
    
    return result;
}

function redrunParse(str, scripts) {
    const args = str.split(' ');
    const parsed = cliParse(args, scripts);
    const result = parsed.cmd || `echo ${parsed.output}`;
    
    return result;
}

