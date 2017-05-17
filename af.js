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
    fn: (name, args, children) => ({
        type: 'FunctionNode',
        name,
        args,
        children
    })
}


module.exports = af
