const { map, load_data } = require('./vm');

const opsWithImmediates = new Set([
  'push', 'gstore', 'gload', 'jump', 'jump_if_false', 'lstore', 'lload',
  'lconstant'
])

const jumpOps = new Set([
  'jump', 'jump_if_false'
])

const constantTypes = {
  0x11: 'function'
}

const blockLabel = block => `_${block.function}_block${block.number}`;

function disassemble (code, dataBuf) {
  const data = load_data(dataBuf)

  const functions = {}
  const blockAddresses = new Set()

  const firstPass = [];

  for (let i = 0; i < data.constants.length; i++) {
    const constant = data.constants[i]

    let args = []

    switch (constant.type) {
      case 0x11:
        functions[constant.address] = constant.name
        args = ['function', constant.name, constant.arg_count, constant.locals_count]
        break
      case 0x12:
        // functions[constant.address] = constant.name
        args = ['string', constant.value]
        break
      default:
        throw new Error(`unknown constant type ${constant.type.toString(16)}`)
    }

    firstPass.push({
      type: 'Directive',
      value: 'constant',
      args
    })
  }

  let i = 0;
  while (i < code.length) {
    if (functions.hasOwnProperty(i))
      firstPass.push({
        type: 'Label',
        value: functions[i]
      })

    const op = code[i++];
    const opName = map[op];

    let immediate

    if (opsWithImmediates.has(opName)) {
      immediate = code.slice(i, i + 2).readUInt16BE()
      i += 2
    }

    if (jumpOps.has(opName)) {
      blockAddresses.add(immediate)
    }

    const line = {
      type: 'Operation',
      value: opName,
      address: i
    }

    if (immediate)
      line.immediate = immediate

    switch (opName) {
      case 'lconstant':
        const constant = data.constants[immediate]
        if (constant.type === 0x11) // function
          line.annotation = `${constant.name}()`
        if (constant.type === 0x12) // string
          line.annotation = `'${constant.value}'`
        break
    }

    firstPass.push(line)
  }

  const orderedBlockAddresses = Array.from(blockAddresses).sort((a, b) => a - b);

  const functionsArray = []

  for (address in functions) {
    functionsArray.push({
      address: Number(address),
      name: functions[address]
    })
  }

  let functionIter = 0;
  let localBlockCount = 0;

  let blocks = {};

  for (let i = 0; i < orderedBlockAddresses.length; i++) {
    const block = orderedBlockAddresses[i];
    while (functionIter + 1 < functionsArray.length && block >= functionsArray[functionIter + 1].address) {
      functionIter++
      localBlockCount = 0
    }

    blocks[block] = {
      function: functionsArray[functionIter].name,
      number: localBlockCount++
    }
  }

  const secondPass = []

  for (let i = 0; i < firstPass.length; i++) {
    const instruction = firstPass[i]

    if (blocks.hasOwnProperty(instruction.immediate))
      instruction.immediate = blockLabel(blocks[instruction.immediate])

    secondPass.push(instruction)

    if (blocks.hasOwnProperty(instruction.address))
      secondPass.push({
        type: 'Label',
        value: blockLabel(blocks[instruction.address])
      })
  }

  return secondPass
}

module.exports = disassemble
