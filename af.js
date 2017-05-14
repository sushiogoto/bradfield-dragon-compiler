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
    dbg: (name, ...args) => {
    	let n = this[name](...args)
    	console.log(n)
    	return n
    }
}


module.exports = af