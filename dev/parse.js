/*
# to test/debug the parser
$ node dev/parse.js <<< '1 + 2 * 3'
{ type: 'OpNode',
  op: '+',
  left: { type: 'Num', value: '1' },
  right:
   { type: 'OpNode',
     op: '*',
     left: { type: 'Num', value: '2' },
     right: { type: 'Num', value: '3' } } }
*/

const fs = require('fs')
const parse = require('../parse')

const stdinStr = fs.readFileSync('/dev/stdin', 'utf8')
const ast = parse(stdinStr)
console.dir(ast, { depth: null })
