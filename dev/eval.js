/*
# test/debug the code generator
$ node dev/eval.js <<< 'dprint 1 + 3 - 2;'
2
*/

const fs = require('fs')
const parse = require('../parse')
const gen = require('../codegen')
const input = fs.readFileSync('/dev/stdin', 'utf8')
const { run } = require('../vm')

const trace = process.argv.indexOf('--trace') > 0 || process.argv.indexOf('-t') > 0;

const { code, data } = gen(parse(input))

run(code, data, trace)
