#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

# given path to code object (dir),
# compiles the handcoded code and data files,
# then runs that code in vm

# provide the code object path as the only argument

function abort {
  echo "$1" 1>&2
  exit 1
}

[[ $# = 1 ]] || abort "provide path to code obj dir"

obj_dir=$1
code_path=$obj_dir/code.yml
data_path=$obj_dir/data.yml

[[ -d $obj_dir ]]   || abort "$obj_dir doesn't exist"
[[ -f $code_path ]] || abort "$code_path doesn't exist"
[[ -f $code_path ]] || abort "$code_path doesn't exist"

# invoke vm with code and data
node --eval '
let fs = require("fs")
let [cf, df] = process.argv.slice(1)
let code = fs.readFileSync(cf)
let data = fs.readFileSync(df)
let vm = require("./vm.js")
vm.run(code, data)
' <(hc "$code_path") <(hc "$data_path")