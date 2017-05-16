// the lexer code is currently regenerated from lang.l every time this module is loaded,
// the generated code could be cached to disk for faster startup times

const fs = require('fs')
const { resolve } = require('path')

const JisonLex = require('jison-lex')
const lexSrcStr = fs.readFileSync(resolve(__dirname, './lang.l'), 'utf8')
const lexer = JisonLex(lexSrcStr)
module.exports = lexer
