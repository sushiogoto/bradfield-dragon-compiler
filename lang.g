%parse-param af
%start program
%%
program
	: add_sub_expression EOF {return $1}
	;
add_sub_expression
	: term
	| add_sub_expression ADD term { $$ = af.op($2, $1, $3)}
	| add_sub_expression SUB term { $$ = af.op($2, $1, $3)}
	;
term
	: num
	| term DIV num { $$ = af.op($2, $1, $3)}
	| term MUL num { $$ = af.op($2, $1, $3)} 
	;
num
	: NUM {$$ = af.num($1)}
	;