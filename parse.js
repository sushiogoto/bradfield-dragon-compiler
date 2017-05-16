// the parser code is currently regenerated from lang.g every time this module is loaded,
// the generated code could be cached to disk for faster startup times

const fs = require('fs')
const { resolve } = require('path')
const jison = require('jison')
const lexer = require('./lex')
const grammar = fs.readFileSync(resolve(__dirname, './lang.g'), 'utf8')
const astFactory = require('./af')

const parser = new jison.Parser(grammar)
parser.lexer = lexer
module.exports = (str) => parser.parse(str, astFactory)
