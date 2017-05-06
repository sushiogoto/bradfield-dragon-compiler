var code = [
	['push', 3],
	['push', 4],
	['add'],
	['push', 1],
	['sub'],
	['halt']
];

function run (code) {
	var operands = [];
	var ip = 0; // aka entryPoint, doesn't have to start at 0

	while (ip < code.length) {
		var currentInstruction = code[ip][0];
		var currentArg = code[ip][1];

		switch (currentInstruction) {
			case 'push':
				operands.push(currentArg);
				break
			case 'add':
				var a = operands.pop();
				var b = operands.pop();
				var result = a + b;
				operands.push(result);
				break
			case 'sub':
				var a = operands.pop();
				var b = operands.pop();
				var result = a - b;
				operands.push(result);
				break
			case 'halt':
				return operands;
			default:
				throw new Error('invalid operation');
		}

		ip++;
	}
}

console.log(run(code)); // [-6]