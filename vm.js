/* eslint-disable */

const fs = require('fs')

// executable code bytecodes
const map = {
  // 0x00 to 0x0f reserved
  0x10: 'push',  // pushes an immediate value (i.e. an allowed value not a pointer) onto the operand stack
  0x11: 'add',  //  adds the top two numbers on the stack and pushes the result back onto stack
  0x12: 'sub',  //  subtracts the top two numbers on the stack and pushes the result back onto stack
  0x13: 'gstore',  // stores value at top of stack in global array, at index arg
  0x14: 'gload',  //  loads from global array (at index arg) onto stack
  0x15: 'jump',  //   mutate instruction pointer to value given by arg
  0x16: 'jump_if_false',  //  `jump` but only if value at top of stack is false
  0x17: 'inc',  // increment value at top of stack by one
  0x18: 'less_than',  //  remove top two stack items--push true to stack if first-popped less than second-popped, else push false
  0x19: 'dprint', // pop top of stack, make human-readable string value from it, write value to stdout with trailing newline
  0x1a: 'lstore', // stores value at top of stack in locals array (at index arg)
  0x1b: 'lload', // load value from locals array (at index arg) to top of stack
  0x1c: 'mul', // pop top two operands, multiply them together, push result
  0x1d: 'call', // invoke the function described in the const array (at index arg), pops params from stack pushes return value
  0x1e: 'return', // change instruction pointer to return address in current stack frame, then remove stack frame
  0xFF: 'halt',  // stops the interpreter
}

// program linker/loader bytecodes
const loader_codes = {
  // 0x00 to 0x0d reserved
  0x0e: 'set_entry' /* ui16 address */,       // set code address of program entry point
  0x0f: 'set_globals_count' /* ui16 count */, // set globals array to length of $count
  0x10: 'load_consts' /* ui16 count */,       // load $count consts definitions into consts array
}

const data_type_bytecodes = {
  // 0x00 to 0x0f reserved
  0x10: 'fn_signature',  // address (ui16), arg-count (ui8), locals count (ui8), name bytes count (ui8), name bytes
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
  let constants = [], type_byte, type_code, record, len
  while (n > 0) {
    type_byte = buf[i]
    i++, n--, record = {}
    type_code = data_type_bytecodes[type_byte]
    switch (type_code) {
      case 'fn_signature':
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

function run (code, data) {
  let tracingEnabled = process.env.DRAGON_ENABLE_TRACE
  let { entry_address, globals_count, constants } = load_data(data)
  let globals = new Array(globals_count)
	let operands = []
	let ip = entry_address
  let callstack = [{
    name: 'main',
    locals: [],
    return_address: null,
  }]
  let topFrame = () => callstack[callstack.length - 1]
  let currentInstruction = code[ip]
  // risk: won't fail if entry point isnt an op code

	while ((currentInstruction = code[ip]) && currentInstruction !== 0xFF && ip < code.length) {
    let instruction = map[currentInstruction]
    let a, b, fn, result
    if (tracingEnabled) {
      let trace = {
        ip,
        instruction_at_ip: map[currentInstruction],
        operand_stack: operands,
        globals,
        callstack: callstack.map(f => f.name),
        locals: topFrame().locals,
      }
      if (!trace.globals.length) delete trace.globals
      if (!trace.locals.length) delete trace.locals
      console.dir(trace)
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
      case 0x19: {
        console.log(operands.pop())
      }; break
      // call
      case 0x1d: {
        // index of fn sig in const array
        let i = code.slice(ip, ip += 2).readUInt16BE()
        let fn = constants[i]
        let frame = {
          name: fn.name,
          return_address: ip,
          locals: new Array(fn.locals_count),
        }
        // if there are two (or more) args,
        // the *first* arg is expected to be on the *top* of the op stack
        for (let j = fn.arg_count; j > 0; j--) {
          frame.locals.push(operands.pop())
        }
        callstack.push(frame)
        ip = fn.address
      }; break
      // return
      case 0x1e: {
        // pop the top of the callstack
        let frame = callstack.pop()
        ip = frame.return_address
        // jump to return address
      }; break
      // lload (local load)
      case 0x1b: {
        let i = code.slice(ip, ip += 2).readUInt16BE()
        operands.push(topFrame().locals[i])
      }; break
			// mul
			case 0x1c: {
				let a = operands.pop()
				let b = operands.pop()
				operands.push(a * b)
			}; break
			// halt
			case 0xFF:
        console.log(operands)
        console.log(globals)
        return
      default:
        throw new Error(`invalid operation ${currentInstruction.toString(16)}`)
    }
  }
}

module.exports = {map, run}

// if (module === require.main) {
//   // const code = fs.readFileSync('./examples/bytecode-programs/program-b/code')
//   const code = new Buffer([ 16, 0, 0, 16, 0, 4, 16, 0, 3, 17, 16, 0, 1, 18, 17, 25 ]);
// 	const data = fs.readFileSync('./examples/bytecode-programs/program-b/data')
//
//   run(code, meta) // [-6]
// }
