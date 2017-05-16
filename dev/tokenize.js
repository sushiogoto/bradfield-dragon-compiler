/*
# to test/debug the lexer
$ node dev/tokenize.js <<< '1 + (2 - 4)'
NUM 1
ADD +
LPAREN (
NUM 2
SUB -
NUM 4
RPAREN )
EOF
*/

const fs = require('fs')
const lexer = require('../lex')
// read input to lex from stdin
const stdinStr = fs.readFileSync('/dev/stdin', 'utf8')
lexer.setInput(stdinStr)
// print each token and lexeme on own line
let tokenClass
do {
  tokenClass = lexer.lex()
  console.log(tokenClass, lexer.yytext)
} while (tokenClass !== 'EOF')
