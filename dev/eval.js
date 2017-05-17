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

const code = Buffer.from(gen(parse(input)))
// todo: use data generated from codegen once it does that
const data = Buffer.from([0x00, 0x00]) // 0 (16bit big end int) globals

run(code, data)
