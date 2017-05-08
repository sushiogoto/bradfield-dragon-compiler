const assert = require('assert')

/*
  write fn which returns string that recognizes: a(b|c)cb*
	- read string
  - take every state and define function for each state
*/

function match (str) {
  let ind = 0
  let char = str[ind]
  let state = s1
  while (state && char) {
    state = state(char)
    ind++
    char = str[ind]
  }
  return state === s4
}

function s1 (c) {
  if (c === 'a') return s2
}

function s2 (c) {
  if (c === 'b' || c === 'c') return s3
}

function s3 (c) {
  if (c === 'c') return s4
}

function s4 (c) {
  if (c === 'b') return s4
}

assert(match('abc'))
assert(!match('a'))
assert(match('abcbbbbbbbbbbbb'))
assert(match('acc'))
assert(!match('accc'))
console.log('tests pass')