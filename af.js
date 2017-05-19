const af = {
    root: functions => ({
        type: 'RootNode',
        functions
    }),
    id: value => ({
        type: 'Id',
        value,
    }),
    num: value => ({
        type: 'Num',
        value,
    }),
    op: (op, left, right) => ({
        type: 'OpNode',
        op,
        left,
        right,
    }),
    dprint: value => ({
    	type: 'DPrint',
    	value
    }),
    fn: (name, params, children) => ({
        type: 'FunctionNode',
        name,
        params,
        children
    }),
    call: (name, args) => ({
        type: 'Call',
        name,
        args
    }),
    ret: value => ({
        type: 'Return',
        value
    }),
    exprStmt: value => ({
        type: 'ExpressionStatement',
        value
    }),
    emptyStmt: () => ({
        type: 'EmptyStatement'
    }),
    assign: (name, value) => ({
        type: 'AssignmentNode',
        name,
        value
    }),
    while: (condition, children) => ({
        type: 'WhileNode',
        condition,
        children
    }),
    if: (condition, consequent) => ({
        type: 'IfNode',
        condition,
        consequent
    }),
    ifElse: (condition, consequent, alternate) => ({
        type: 'IfElseNode',
        condition,
        consequent,
        alternate
    }),
    block: (children) => ({
        type: 'BlockStatement',
        children
    })
}


module.exports = af
