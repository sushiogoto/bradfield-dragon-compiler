// '[ 1, [ 2, [ 3, 4 ] ] ]'

var input = '[ 1, [ 2, [ 3, 4 ] ] ]';

function lex (input) {
  input = input.split('').concat(['EOF'])
  var tokens = []
  const lexemeToTokenClass = {
  	'[': 'LBRACK',
  	']': 'RBRACK',
  	',': 'COMMA',
  	'EOF': 'EOF'
  }
  let currentNum = '';

  for (let char of input) {
  	if (/\d/.test(char)) {
    	currentNum += char;
    	continue
  	}
  	if (currentNum.length > 0) {
  		tokens.push(['NUM', currentNum])
  		currentNum = ''
  	}
  	if(/\s/.test(char)) continue
  	if (lexemeToTokenClass.hasOwnProperty(char)) {
  		tokens.push([ lexemeToTokenClass[char], char ]);
    } else { throw new Error(`unrecognized lexeme ${char}`) }
  }
  return tokens;
}

// console.log(lex(input))
// console.log(lex("[123"))

/*
[ [ 'LBRACK', '[' ],
  [ 'NUM', '1' ],
  [ 'COMMA', ',' ],
  [ 'LBRACK', '[' ],
  [ 'NUM', '2' ],
  ...
*/

let ast = listNode([ 'NUM', '1' ], 
	listNode([ 'NUM', '2' ],
		listNode([ 'NUM', '3'], [ 'NUM', '4'])))
// console.dir(ast, { depth: null });
function listNode(...nodes) {
	return {
		type: 'listNode',
		children: nodes
	}
}
// start 	: list EOF
// list 	: LBRACK elements RBRACK ;
// elements : element (comma element)* ;
// element 	: NUM
// 			| list
// 			;

// list 	: LBRACK elements RBRACK ;

let lookAhead = (o, tokenClass) => {
	let {ts, position} = o
	let token = ts[position] // token ['comma', ',']
	return tokenClass === token[0]
}

let consume = (o, tokenClass) => {
	if (lookAhead(o, tokenClass)) {
		o.position++
		return o.ts[o.position - 1]
	}
	throw new Error(`Expected: ${tokenClass} at pos: ${o.position}, got: ${o.ts[o.position]}`)
}
// start 	: list EOF
let start = (o) => {
	let ast = list(o)
	consume(o, 'EOF')
	return ast
}

// list 	: LBRACK elements RBRACK ;
// {ts, position}
let list = (o) => {
	consume(o, 'LBRACK')
	let result = elements(o)
	consume(o, 'RBRACK')
	return listNode(...result)
}

// elements : element (COMMA element)* ;
let elements = (o) => {
	let result = [element(o)]
	while(lookAhead(o, 'COMMA')){
		consume(o, 'COMMA')
		result.push(element(o)) 
	}
	return result
}

// element 	: NUM
// 			| list
// 			;
let element = (o) => {
	if (lookAhead(o, 'NUM')) {
		return consume(o, 'NUM')
	} else {
		return list(o)
	}
}

// console.dir(start({ts: lex('[[[1],[2]], 3]'), position: 0}), {depth: null})
console.dir(start({ts: lex(input), position: 0}), {depth: null})


