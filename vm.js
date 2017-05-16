/* eslint comma-dangle: ["error", "always-multiline"] */

const fs = require('fs')

const map = {
  0x10: 'push',  // pushes an immediate value (i.e. an allowed value not a pointer) onto the operand stack
  0x11: 'add',  //  adds the top two numbers on the stack and pushes the result back onto stack
  0x12: 'sub',  //  subtracts the top two numbers on the stack and pushes the result back onto stack
  0x13: 'gstore',  // stores value at top of stack in global array, at index arg
  0x14: 'gload',  //  loads from global array (at index arg) onto stack
  0x15: 'jump',  //   mutate instruction pointer to value given by arg
  0x16: 'jump_if_false',  //  `jump` but only if value at top of stack is false
  0x17: 'inc',  // increment value at top of stack by one
  0x18: 'less_than',  //  remove top two stack items--push true to stack if first-popped less than second-popped, else push false
  0X19: 'dprint',
  0xFF: 'halt',  // stops the interpreter
}

function run (code, meta) {
  const globalSize = meta.readUInt16BE()
  let globals = new Array(globalSize)

  var operands = []
  var ip = 0 // aka entryPoint, doesn't have to start at 0

  while (ip < code.length) {
    var currentInstruction = code[ip]
    let a, b, result
    console.log({currentInstruction: map[currentInstruction], ip, operands, globals})
    ip++

    switch (currentInstruction) {
      // push
      case 0x10:
        a = code.slice(ip, ip + 2).readInt16BE()
        ip += 2
        operands.push(a)
        break
      // add
      case 0x11:
        a = operands.pop()
        b = operands.pop()
        result = a + b
        operands.push(result)
        break
      // sub
      case 0x12:
        a = operands.pop()
        b = operands.pop()
        result = a - b
        operands.push(result)
        break
      // gstore
      case 0x13:
        a = operands.pop()
        b = code.slice(ip, ip += 2).readUInt16BE()
        globals[b] = a
        break
       // gload
      case 0x14:
        a = code.slice(ip, ip += 2).readUInt16BE()
        operands.push(globals[a])
        break
      // jump
      case 0x15:
        ip = code.slice(ip, ip + 2).readUInt16BE()
        break
      // jump_if_false
      case 0x16:
        a = operands.pop()
        b = code.slice(ip, ip += 2).readUInt16BE()
        if (a === false) {
          ip = b
        }
        break
      // inc
      case 0x17:
        a = operands.pop()
        operands.push(a + 1)
        break
      // less_than
      case 0x18:
        a = operands.pop()
        b = operands.pop()
        operands.push(a < b)
        break
      // dprint
      case 0x19:
        console.log(operands.pop())
        break
      // halt
      case 0xFF:
        console.log(operands)
        console.log(globals)
        return
      default:
        throw new Error('invalid operation')
    }
  }
}

module.exports = { run, map }

if (module === require.main) {
  // const code = fs.readFileSync('./examples/bytecode-programs/program-b/code')
  const code = new Buffer([ 16, 0, 0, 16, 0, 4, 16, 0, 3, 17, 16, 0, 1, 18, 17, 25 ])
  const meta = fs.readFileSync('./examples/bytecode-programs/program-b/meta')

  run(code, meta) // [-6]
}
