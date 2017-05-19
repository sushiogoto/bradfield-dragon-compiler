/*
# test/debug the code generator
$ node dev/disasm.js <<< 'dprint 1 + 3 - 2;'
2
*/

const fs = require('fs')
const parse = require('../parse')
const gen = require('../codegen')
const input = fs.readFileSync('/dev/stdin', 'utf8')
const disassemble = require('../disassemble')

const { code, data } = gen(parse(input))

const lines = disassemble(code, data)

lines.forEach(line => {
  switch (line.type) {
    case 'Operation':
      let str = `\t${line.value} ${line.args.join(' ')}`
      if (line.annotation)
        str += `\t# ${line.annotation}`
      console.log(str)
      break
    case 'Directive':
      console.log(`.${line.value}`, line.args.join(' '))
      break
    case 'Label':
      console.log(`${line.value}:`)
      break
    default:
      throw new Error(`cannot handle instruction of type "${line.type}"`)
  }
})
