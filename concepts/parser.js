const tokens = [
  [ 'int', '1' ],
  [ 'operator', '-' ],
  [ 'paren', '(' ],
  [ 'int', '3' ],
  [ 'operator', '+' ],
  [ 'int', '4' ],
  [ 'paren', ')' ],
  [ 'operator', '+' ],
  [ 'int', '0' ]
];

// -
// +

function Node (val, left, right) {
  this.val = val; // required, either '+' or '-'
  this.left = left; // null, node, or number
  this.right = right; // null, node, or number
}

const parse = tokens => {
  let stack = [];

  let i = 0;

  while (i < tokens.length) {
    stack.push(tokens[i++]);

    let reduced = true;

    while (reduced) {
      reduced = false;

      if (stack[stack.length - 1][0] === 'int') {
        const intToken = stack.pop();

        stack.push([ 'EXPRESSION', Number(intToken[1]) ]);
        reduced = true;
      }

      if (stack.length >= 3 &&
          stack[stack.length - 3][0] === 'paren' &&
          stack[stack.length - 3][1] === '(' &&
          stack[stack.length - 2][0] === 'EXPRESSION' &&
          stack[stack.length - 1][0] === 'paren' &&
          stack[stack.length - 1][1] === ')') {
        stack.pop();
        const expression = stack.pop();
        stack.pop();

        stack.push(expression);
        reduced = true;
      }

      if (stack.length >= 3 &&
          stack[stack.length - 3][0] === 'EXPRESSION' &&
          stack[stack.length - 2][0] === 'operator' &&
          stack[stack.length - 1][0] === 'EXPRESSION') {
        const right = stack.pop();
        const operator = stack.pop();
        const left = stack.pop();

        stack.push([ 'EXPRESSION', new Node(operator[1], left[1], right[1]) ]);
        reduced = true;
      }
    }
  }

  if (stack.length > 1) {
    console.error(stack);
    throw new Error('Parsing failed');
  }

  const result = stack[0];

  if (result[0] !== 'EXPRESSION') {
    console.error(stack);
    throw new Error('Parse resulted in nonterminal');
  }

  return result[1];
};

const util = require('util');

// console.log(util.inspect(parse(tokens), { showHidden: false, depth: null }));
if (module === require.main) {
    console.log(parse([
      [ 'int', '1' ],
      [ 'operator', '+' ],
      [ 'int', '2' ],
      [ 'operator', '-' ],
      [ 'int', '3' ]
    ]));
}

module.exports = {
  Node,
  parse
};