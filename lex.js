var input = '1 - ( 3 + 4) + 0';

// [
//   ['int', '1'],
//   ['op', '-'],
//   ['paren', '('],
//   ['int' ,'3'],
//   ['op', '+'],
//   ['int', '4'],
//   ['paren', ')'],
//   ['op', '+'],
//   ['int', '0']
// ]

// [ [ 'int', '1' ],
//   [ 'operator', '-' ],
//   [ 'paren', '(' ],
//   [ 'int', '3' ],
//   [ 'operator', '+' ],
//   [ 'int', '4' ],
//   [ 'paren', ')' ],
//   [ 'operator', '+' ],
//   [ 'int', '0' ] ]

// bug, this input: "12 + 3"

function lex (input) {
  var tokens = []
  for (let char of input) {
    if (/\s/.test(char)) continue
    else if (/\d/.test(char)) tokens.push(['int', char])
    else if (/[\+|\-]/.test(char)) tokens.push(['operator', char])
    else if (/[\(|\)]/.test(char)) tokens.push(['paren', char])
    else { throw new Error(`unrecognized lexeme ${char}`) }
  }
  return tokens;
}

console.log(lex(input))
