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

  const functions = Object.create(null)
  let address = 0

  while (stack.length) {
    var node = stack.pop()
    switch (node.type) {
      case 'RootNode':
        stack = stack.concat(node.functions)
        break
      case 'FunctionNode':
        if (node.name === 'main') {
          code.unshift(0xff)
          address++
        }

        const fn = {
          name: node.name,
          arg_count: 0,
          locals_count: 0
        }
        functions[node.name] = fn

        // since we're emitting bytecode in reverse
        // we're currently at the end of the function
        // we need to know the address of the first instruction in the function
        // so we add a phony node to be visited once this function is finished
        // the handler for the EndFunction node will set the entry address
        stack = stack.concat({
          type: 'EndFunction',
          fn
        }).concat(node.children)
        break
      case 'EndFunction':
        // this is the distance from the end of the function
        // we'll need this to be the distance from the beginning
        // so we will subtract this from the length of the buffer below this
        // while loop to get the true address
        node.fn.address = address;
        break
      case 'DPrint':
        code.unshift(0x19)
        address++
        stack.push(node.value)
        break
      case 'OpNode':
        switch (node.op) {
          case '+':
            code.unshift(0x11)
            address++
            break
          case '-':
            code.unshift(0x12)
            address++
            break
          case '*':
            code.unshift(0x1c)
            address++
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
        address += 3
        break
      default:
        throw new Error(`unsupported node type "${node.type}"`)
    }
  }

  // function addresses are currently distance from the end of code
  // convert them to distance from beginning of code
  for (name in functions) {
    const fn = functions[name]
    fn.address = code.length - fn.address
  }

  if (!('main' in functions))
    throw new Error('could not find main function')

  // { entry_address, globals_count, constants }
  const entry_address = functions['main'].address;

  const t_benc = n => {
    const buf = Buffer.allocUnsafe(2)
    buf.writeUInt16BE(n)
    return [buf[0], buf[1]]
  }

  return {
    code: Buffer.from(code),
    data: Buffer.from([0x0e].concat(t_benc(entry_address)).concat([0x0f, 0x00, 0x00, 0x10, 0x00, 0x00]))
  }
}

module.exports = codegen
