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
    })
}


module.exports = af
