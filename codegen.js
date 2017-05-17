// we traverse the ast in preorder (root node first, then left to right),
// but we "unshift" the generated code into the output array.
// so if you read the generated code left to right, it looks like the
// result of a postorder (right to left) traversal

// also, this generator doesn't know anything about functions,
// you could say it thinks all that exists is the body of a "main"
// function that calls no other functions

function codegen (ast) {
  var stack = [ast]
  var code = []
  while (stack.length) {
    var node = stack.pop()
    switch (node.type) {
      case 'RootNode':
        code.unshift(0xff)
        stack = stack.concat(node.children)
        break
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
          case '*':
            code.unshift(0x1c)
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
  return code
}

module.exports = codegen
