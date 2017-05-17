const af = {
    root: children => ({
        type: 'RootNode',
        children
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
    })
}


module.exports = af
