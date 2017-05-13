const af = {
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
}

module.exports = af