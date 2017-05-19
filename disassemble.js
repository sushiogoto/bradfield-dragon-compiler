const { map, load_data } = require('./vm');

const opsWithImmediates = new Set([
  'push', 'gstore', 'gload', 'jump', 'jump_if_false', 'lstore', 'lload',
  'call'
])

const constantTypes = {
  0x11: 'function'
}

function disassemble (code, dataBuf) {
  const data = load_data(dataBuf)

  const functions = {}

  const lines = [];

  for (let i = 0; i < data.constants.length; i++) {
    const constant = data.constants[i]

    let args = []

    switch (constant.type) {
      case 0x11:
        functions[constant.address] = constant.name
        args = ['function', constant.name, constant.arg_count, constant.locals_count]
        break
      default:
        throw new Error(`unknown constant type ${constant.type.toString(16)}`)
    }

    lines.push({
      type: 'Directive',
      value: 'constant',
      args
    })
  }

  let i = 0;
  while (i < code.length) {
    if (functions.hasOwnProperty(i))
      lines.push({
        type: 'Label',
        value: functions[i]
      })

    const op = code[i++];
    const opName = map[op];
    const inst = []

    let immediate

    if (opsWithImmediates.has(opName)) {
      immediate = code.slice(i, i + 2).readUInt16BE()
      i += 2

      inst.push(immediate)
    }

    const line = {
      type: 'Operation',
      value: opName,
      args: inst
    }

    switch (opName) {
      case 'call':
        line.annotation = data.constants[immediate].name || '??'
        break
    }

    lines.push(line)
  }

  return lines
}

module.exports = disassemble
