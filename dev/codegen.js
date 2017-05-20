/*
# test/debug the code generator
$ node dev/codegen.js <<< '1 + 2 - 3'
[ 16, 0, 3, 16, 0, 2, 16, 0, 1, 17, 18 ]
*/

const fs = require('fs')
const parse = require('../parse')
const gen = require('../codegen')
const input = fs.readFileSync('/dev/stdin', 'utf8')
// todo: output code and data segments
// todo: dissasemble output
console.dir(gen(parse(input)))
