const fs = require('fs')

// first 16 codes are reserved in case we need them for special codes later on
// 0x10 'push' pushes an immediate value (i.e. an allowed value not a pointer) onto the operand stack
// 0x11 'add'  adds the top two numbers on the stack and pushes the result back onto stack
// 0x12 'sub'  subtracts the top two numbers on the stack and pushes the result back onto stack
// 0xFF 'halt' stops the interpreter

// var code = [
// 	['push', 3],
// 	['push', 4],
// 	['add'],
// 	['push', 1],
// 	['sub'],
// 	['halt']
// ];

// var code = [
// 	[0x10, 3],
// 	[0x10, 4],
// 	[0x11],
// 	[0x10, 1],
// 	[0x12],
// 	[0xFF]
// ];

function run (code) {
	var operands = []
	var ip = 0 // aka entryPoint, doesn't have to start at 0

	while (ip < code.length) {
		var currentInstruction = code[ip]
    let a, b, result
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
			// halt
			case 0xFF:
				return operands
			default:
				throw new Error('invalid operation')
		}
	}
}

if (module === require.main) {
	let code = fs.readFileSync('./examples/bytecode-programs/program-a/code')

  console.log(run(code)) // [-6]
}
