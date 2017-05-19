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
  0x19: 'dprint',
  0x1a: 'lstore',
  0x1b: 'lload',
  0x1c: 'mul',
  0x1d: 'call', // 
  0x1e: 'return',
  0x1f: 'pop', // removes the value at the top of the stack
  0x20: 'div', // these are disturbingly out of order
  0xFF: 'halt',  // stops the interpreter
}

// program linker/loader bytecodes
const loader_codes = {
  // 0x00 to 0x0d reserved
  0x0e: 'set_entry' /* ui16 address */,       // set code address of program entry point
  0x0f: 'set_globals_count' /* ui16 count */, // set globals array to length of $count
  0x10: 'load_consts' /* ui16 count */,       // load $count consts definitions into consts array
  0x11: 'load_function' // load function
}

function load_data (buf, i = 0) {
  let byte, loader_code, n, a
  let globals_count = 0
  let entry_address = 0
  let constants = []
  while (i < buf.length) {
    byte = buf[i]
    i++
    loader_code = loader_codes[byte]
    switch (loader_code) {
      case 'set_entry':
        n = buf.slice(i, i + 2).readUInt16BE(); i += 2
        entry_address = n
        break
      case 'set_globals_count':
        n = buf.slice(i, i + 2).readUInt16BE(); i += 2
        globals_count = n
        break
      case 'load_consts':
        n = buf.slice(i, i + 2).readUInt16BE(); i += 2
        ;[constants, i] = load_consts(buf, n, i)
        break
      default:
        throw new Error(`unrecognized loader code ${byte.toString(16)} at index of ${i-1} of data`)
    }
  }
  return { entry_address, globals_count, constants }
}

function load_consts (buf, n, i = 0) {
  let constants = [], type_byte, record, len
  while (n > 0) {
    type_byte = buf[i]
    i++, n--, record = {}
    switch (type_byte) {
      // load function code
      case 0x11:
        record.type = type_byte
        record.address = buf.slice(i, i + 2).readUInt16BE(); i += 2
        record.arg_count = buf[i]; i += 1
        record.locals_count =  buf[i]; i += 1
        len = buf[i]; i += 1
        record.name = buf.slice(i, i + len).toString('utf8'); i += len
        constants.push(record)
        break;
      default:
        throw new Error(`unrecognized const type code ${type_byte.toString(16)} at index of ${i-1} of data`)
    }
  }
  return [constants, i]
}

function run (code, data, trace) {
  let { entry_address, globals_count, constants } = load_data(data)
  let globals = new Array(globals_count)
  var operands = []
  var ip = entry_address
  let callStack = [{fnName: 'main', locals: []}]

  while (ip < code.length) {
    var currentInstruction = code[ip]
    let a, b, result

    if (trace) {
      console.log({
        function: callStack[callStack.length - 1].fnName,
        currentInstruction: map[currentInstruction],
        ip, operands, globals, locals: callStack[callStack.length - 1].locals
      })
    }

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
        if (a == false) { // allow "falsy" values (for example, 0)
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
      // call 
      // takes in an unsigned integer that is index in consts array
      case 0x1d: {
        let index = code.slice(ip, ip += 2).readUInt16BE()
        let fSig = constants[index]
        let locals = []
        for(let j=0; j < fSig.arg_count; j++){
          locals.push(operands.pop())
        }
        let frame = {
          locals: locals,
          returnAddr: ip,
          fnName: fSig.name
        }

        callStack.push(frame)
        ip = fSig.address

      };break
      // local store
      case 0x1a: {
        a = code.slice(ip, ip += 2).readUInt16BE()
        let index = callStack.length - 1
        callStack[index].locals[a] = operands.pop()
      };break
      // local load
      case 0x1b: {
        a = code.slice(ip, ip += 2).readUInt16BE()
        let index = callStack.length - 1
        operands.push(callStack[index].locals[a])
      };break
      // mult
      case 0x1c:
        a = operands.pop()
        b = operands.pop()
        result = a * b
        operands.push(result)
        break
      // mult
      case 0x20:
        a = operands.pop()
        b = operands.pop()
        result = a / b
        operands.push(result)
        break
      // return
      case 0x1e:
        frame = callStack.pop()
        ip = frame.returnAddr
        break
      // pop
      case 0x1f:
        operands.pop()
        break
      // halt
      case 0xFF:
        if (trace) {
          console.log(operands)
          console.log(globals)
        }
        return
      default:
        throw new Error(`invalid operation ${currentInstruction.toString(16)}`)
    }
  }
}

module.exports = { run, map, load_data }
