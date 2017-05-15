// { type: 'DPrint',
//   value: 
//    { type: 'OpNode',
//      op: '+',
//      left: { type: 'OpNode', op: '*', left: [Object], right: [Object] },
//      right: { type: 'Num', value: '4' } } }
// "dprint (1 + 2) * 3 + 4;"

// { type: 'DPrint',
//   value: 
//    { type: 'OpNode',
//      op: '+',
//      left: { type: 'Num', value: '1' },
//      right: { type: 'Num', value: '2' } } }

function codegen (ast) {
  console.log(ast)
  var stack = [ast];
  var code = [];
  while (stack.length) {
    var node = stack.pop();
    
    // make a switch statement based on node type
    // when dprint -> shift bytecode onto code array
    //    push value onto the stack
    // when OpNode ->
    //    if op '+' -> shift ADD onto code array
    //    if op '-' -> shift SUB onto code array
    //    push right onto the stack
    //    push left onto the stack
    // when Num ->
    //    shift int onto the code array in little endian
    //    shift bytecode onto the code array
    switch (node.type) {
      case 'DPrint':
        code.unshift(0x19)
        stack.push(node.value)
        break
      case 'OpNode':
        switch (node.op) {
          case '+':
            code.unshift(0x11)
            break
          case '-':
            code.unshift(0x12)
            break
          default:
            throw new Error(`unsupported operation "${node.op}"`)
        }

        stack.push(node.right)
        stack.push(node.left)
        break
      case 'Num':
        const buf = Buffer.allocUnsafe(2)
        buf.writeInt16LE(node.value)
        code.unshift(buf[0])
        code.unshift(buf[1])
        code.unshift(0x10)
        break
      default:
        throw new Error(`unsupported node type "${node.type}"`)
    }
  }
  return code;
} 

module.exports = codegen
