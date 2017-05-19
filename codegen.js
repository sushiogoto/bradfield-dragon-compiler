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
  let functionCount = 0;
  let functionStack = [];

  let position = 0

  while (stack.length) {
    var node = stack.pop()
    switch (node.type) {
      case 'RootNode':
        stack = stack.concat(node.functions)
        break
      case 'FunctionNode':
        if (node.name === 'main') {
          code.unshift(0xff)
          position++
        }

        const fn = {
          name: node.name,
          number: functionCount++,
          params: node.params,
          locals: node.params.slice()
        }
        functions[node.name] = fn
        functionStack.push(fn)

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
        node.fn.positionFromEnd = position
        functionStack.pop()
        break
      case 'DPrint':
        code.unshift(0x19)
        position++
        stack.push(node.value)
        break
      case 'Call':
        // the function being called might not have been added to functions yet
        // so we'll just add the name here and replace it after the code has
        // been generated
        code.unshift(0)
        code.unshift(node.name)
        code.unshift(0x1d)
        position += 3

        for (let i = 0; i < node.args.length; i++) {
          stack.push(node.args[node.args.length - i - 1])
        }
        break
      case 'Return':
        code.unshift(0x1e)
        position++
        stack.push(node.value)
        break
      case 'OpNode':
        switch (node.op) {
          case '+':
            code.unshift(0x11)
            position++
            break
          case '-':
            code.unshift(0x12)
            position++
            break
          case '*':
            code.unshift(0x1c)
            position++
            break
          default:
            throw new Error(`unsupported operation "${node.op}"`)
        }

        stack.push(node.right)
        stack.push(node.left)
        break
      case 'Num': {
        const buf = Buffer.allocUnsafe(2)
        buf.writeInt16LE(node.value)
        code.unshift(buf[0])
        code.unshift(buf[1])
        code.unshift(0x10)
        position += 3
      }; break
      case 'Id': {
        const currentFunction = functionStack[functionStack.length - 1]

        // since we're generating code in reverse, variable lookups happen
        // before they're defined
        // the only way I can think to validate that variables are declared
        // before use is to do two passes over the AST
        // and that probably belongs in semantic analysis, so we will assume
        // any variable references we encounter are valid, and add them to the
        // list of locals

        let paramNumber = currentFunction.locals.indexOf(node.value)

        if (paramNumber < 0) {
          paramNumber = currentFunction.locals.length
          currentFunction.locals.push(node.value)
        }

        const buf = Buffer.allocUnsafe(2)
        buf.writeInt16LE(paramNumber)
        code.unshift(buf[0])
        code.unshift(buf[1])
        code.unshift(0x1b)
        position += 3
      }; break
      case 'ExpressionStatement':
        // this represents a single expression in a statement
        // where nothing is done with the return value
        // for example, "doSomething();"

        // throw away unused return value
        code.unshift(0x1f)
        position++

        stack.push(node.value)
        break
      case 'AssignmentNode': {
        const currentFunction = functionStack[functionStack.length - 1]

        let paramNumber = currentFunction.locals.indexOf(node.name)

        if (paramNumber < 0) {
          paramNumber = currentFunction.locals.length
          currentFunction.locals.push(node.name)
        }

        const buf = Buffer.allocUnsafe(2)
        buf.writeInt16LE(paramNumber)

        // since assignments are expressions
        // they need to leave a value on the stack
        // for example, "a = b = 10" or "while(c = getChar()) {}"

        // so we load the assigned value back onto the stack after storing it
        code.unshift(buf[0])
        code.unshift(buf[1])
        code.unshift(0x1b)
        position += 3

        code.unshift(buf[0])
        code.unshift(buf[1])
        code.unshift(0x1a)
        position += 3

        stack.push(node.value)
      }; break
      default:
        throw new Error(`unsupported node type "${node.type}"`)
    }
  }

  // function addresses are currently distance from the end of code
  // convert them to distance from beginning of code
  for (name in functions) {
    const fn = functions[name]
    fn.address = code.length - fn.positionFromEnd
  }

  // TODO: need to make it explicit these are function symbols
  // resolve symbol references
  let i = 0;

  while (i < code.length) {
    if (typeof code[i] === 'string') {
      if (!(code[i] in functions))
        throw new Error(`could not find symbol "${code[i]}"`)
      const fn = functions[code[i]]
      const buf = Buffer.allocUnsafe(2)
      buf.writeUInt16BE(fn.number)
      code[i] = buf[0]
      code[i + 1] = buf[1]
      i++
    }

    i++
  }

  if (!('main' in functions))
    throw new Error('could not find main function')

  // { entry_address, globals_count, constants }
  const entry_address = functions['main'].address
  const constantCount = functionCount

  const constants = []

  for (name in functions) {
    const fn = functions[name]

    constants.push(0x11) // load function sig

    const addrBuf = Buffer.allocUnsafe(2)
    addrBuf.writeUInt16BE(fn.address)

    constants.push(addrBuf[0]) // code address
    constants.push(addrBuf[1])

    constants.push(fn.params.length) // number of arguments
    constants.push(fn.locals.length) // number of locals
    constants.push(name.length) // length of name

    for (c of name) constants.push(c.charCodeAt(0))
  }

  // TODO: clean up all this
  const t_benc = n => {
    const buf = Buffer.allocUnsafe(2)
    buf.writeUInt16BE(n)
    return [buf[0], buf[1]]
  }

  return {
    code: Buffer.from(code),
    data: Buffer.from([0x0e].concat(t_benc(entry_address)).concat([0x0f, 0x00, 0x00, 0x10]).concat(t_benc(constantCount)).concat(constants))
  }
}

module.exports = codegen
