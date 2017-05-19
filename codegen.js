// we traverse the ast in preorder (root node first, then left to right),
// but we "unshift" the generated code into the output array.
// so if you read the generated code left to right, it looks like the
// result of a postorder (right to left) traversal

const uniq = (() => {
  let counter = 0
  return () => `block${counter++}`
})()

function getFunctions(ast) {
  const constants = []
  const functions = Object.create(null)

  if (ast.type !== 'RootNode')
    throw new Error('malformed ast')

  for (let i = 0; i < ast.functions.length; i++) {
    const node = ast.functions[i]

    const fn = {
      type: 'function',
      name: node.name,
      number: constants.length,
      params: node.params,
      locals: node.params.slice()
    }

    functions[node.name] = fn
    constants.push(fn)
  }

  return {
    functions,
    constants
  }
}

function codegen (ast) {
  var stack = [ast]
  var code = []

  const { constants, functions } = getFunctions(ast)
  let functionStack = []

  const symbols = Object.create(null)

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

        const fn = functions[node.name]

        if (fn.type !== 'function')
          throw new Error('fairly certain this error is unreachable')

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
        // this is the distance from the end of the code
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
      case 'Call': {
        code.unshift(0x1d)
        position++

        const fn = functions[node.name]

        if (fn.type !== 'function')
          throw new Error(`could not find function ${node.name}`)

        const buf = Buffer.allocUnsafe(2)
        buf.writeInt16LE(fn.number)
        code.unshift(buf[0])
        code.unshift(buf[1])
        code.unshift(0x21)
        position += 3

        for (let i = 0; i < node.args.length; i++) {
          stack.push(node.args[node.args.length - i - 1])
        }
      }; break
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
          case '/':
            code.unshift(0x20)
            position++
            break
          case '<':
            code.unshift(0x18)
            position++
            break
          case '>':
            code.unshift(0x22)
            position++
            break
          case '<=':
            code.unshift(0x23)
            position++
            break
          case '>=':
            code.unshift(0x24)
            position++
            break
          case '==':
            code.unshift(0x27)
            position++
            break
          case '&&':
            code.unshift(0x25)
            position++
            break
          case '%':
            code.unshift(0x26)
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
      case 'EmptyStatement':
        // nothing to do
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
      case 'WhileNode':
        const whileEndId = uniq()
        const whileStartId = uniq()

        symbols[whileEndId] = position

        // we don't know the address of the start of the while loop yet
        // so we'll use a placeholder value to represent it
        code.unshift(0) // empty placeholder
        code.unshift({
          type: 'symbol',
          id: whileStartId
        })
        code.unshift(0x15)
        position += 3

        // add phony nodes
        // one will emit while conditional jump
        // and the other will set the beginning position
        // for the above instruction to jump to
        stack = stack.concat({
          type: 'EndWhile',
          start: whileStartId,
          end: whileEndId
        }).concat(node.condition).concat({
          type: 'ConditionalJumpIfFalse',
          target: whileEndId
        }).concat(node.children)
        break
      case 'ConditionalJumpIfFalse':
        // this is shared between while loops, if statements and if else statements
        // we don't know the address of the end of the conditional yet
        // so we'll use a placeholder value to represent it
        code.unshift(0) // empty placeholder
        code.unshift({
          type: 'symbol',
          id: node.target
        })
        code.unshift(0x16)
        position += 3

        break
      case 'EndWhile':
        // distance of the beginning of the while from the end of the code
        symbols[node.start] = position

        break
      case 'IfNode':
        const ifEndId = uniq()

        symbols[ifEndId] = position

        // add phony node to emit if conditional jump
        stack = stack.concat(node.condition).concat({
          type: 'ConditionalJumpIfFalse',
          target: ifEndId
        }).concat(node.consequent)
        break
      case 'IfElseNode':
        const ifElseEndId = uniq()
        const ifElseMiddleId = uniq()

        symbols[ifElseEndId] = position

        // add phony node to emit if conditional jump
        stack = stack.concat(node.condition).concat({
          type: 'ConditionalJumpIfFalse',
          target: ifElseMiddleId
        }).concat(node.consequent).concat({
          type: 'IfElseMiddle',
          middle: ifElseMiddleId,
          end: ifElseEndId
        }).concat(node.alternate)
        break
      case 'IfElseMiddle':
        // mark the beginning of the alternate
        symbols[node.middle] = position

        // jump to end of if-else after executing consequent
        // we don't know the address of the end of the conditional yet
        // so we'll use a placeholder value to represent it
        code.unshift(0) // empty placeholder
        code.unshift({
          type: 'symbol',
          id: node.end
        })
        code.unshift(0x15)
        position += 3

        break
      case 'BlockStatement':
        // many languages (not ES5, though!) will create a nested lexical scope
        // when entering a block
        // we're not supporting that (right now)
        stack = stack.concat(node.children)
        break
      case 'String': {
        const number = constants.length;

        const str = {
          type: 'string',
          number,
          value: node.value
        }
        constants.push(str)

        const buf = Buffer.allocUnsafe(2)
        buf.writeInt16LE(number)
        code.unshift(buf[0])
        code.unshift(buf[1])
        code.unshift(0x21)
        position += 3
      }; break
      default: console.log(node)
        throw new Error(`unsupported node type "${node.type}"`)
    }
  }

  // function addresses are currently distance from the end of code
  // convert them to distance from beginning of code
  for (name in functions) {
    const fn = functions[name]
    fn.address = code.length - fn.positionFromEnd
  }

  // resolve symbol references
  let i = 0;

  while (i < code.length) {
    if (code[i].type === 'symbol') {
      const id = code[i].id

      if (!(id in symbols))
        throw new Error(`could not find symbol "${id}"`)

      const address = code.length - symbols[id]

      const buf = Buffer.allocUnsafe(2)
      buf.writeUInt16BE(address)
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

  const constantsCode = []

  for (let i = 0; i < constants.length; i++) {
    const constant = constants[i]

    switch (constant.type) {
      case 'function': {
        constantsCode.push(0x11) // load function sig

        const addrBuf = Buffer.allocUnsafe(2)
        addrBuf.writeUInt16BE(constant.address)

        constantsCode.push(addrBuf[0]) // code address
        constantsCode.push(addrBuf[1])

        constantsCode.push(constant.params.length) // number of arguments
        constantsCode.push(constant.locals.length) // number of locals
        constantsCode.push(constant.name.length) // length of name

        for (c of constant.name) constantsCode.push(c.charCodeAt(0))
        }; break
      case 'string': {
        constantsCode.push(0x12) // load function sig
        constantsCode.push(constant.value.length) // length of name
        for (c of constant.value) constantsCode.push(c.charCodeAt(0))
        }; break
      default:
        throw new Error(`unrecognized constant type "${constant.type}"`)
    }
  }

  // TODO: clean up all this
  const t_benc = n => {
    const buf = Buffer.allocUnsafe(2)
    buf.writeUInt16BE(n)
    return [buf[0], buf[1]]
  }

  return {
    code: Buffer.from(code),
    data: Buffer.from([0x0e].concat(t_benc(entry_address)).concat([0x0f, 0x00, 0x00, 0x10]).concat(t_benc(constants.length)).concat(constantsCode))
  }
}

module.exports = codegen
