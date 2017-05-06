function Node (val, left, right) {
  this.val = val; // required: '+' or '-'
  this.left = left; // polymorphic: null, node, number
  this.right = right; // polymorphic: null, node, number
}

var ast = new Node('sub', 1, new Node('add', 3, 4));

function codegen (ast) {
  var stack = [ast];
  var code = [];
  while (stack.length) {
    var node = stack.pop();
    if (node.val) {
      code.push([node.val]);

      if (node.right) {
        stack.push(node.right);
      }

      if (node.left) {
        stack.push(node.left);
      }
    } else {
      code.push(['push', node]);
    }
    
  }
  return code.reverse();
} 

console.log(codegen(ast));