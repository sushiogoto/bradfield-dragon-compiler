%parse-param af
%start program
%%
program
	: DPRINT exp1 SC EOF { return af.dprint($2) }
	| exp1 EOF {return $1}
	;
exp1
	: exp2
	| exp1 ADD exp2 { $$ = af.op($2, $1, $3)}
	| exp1 SUB exp2 { $$ = af.op($2, $1, $3)}
	;
exp2
	: exp3
	| exp2 DIV exp3 { $$ = af.op($2, $1, $3)}
	| exp2 MUL exp3 { $$ = af.op($2, $1, $3)} 
	;
exp3
	: NUM {$$ = af.num($1)}
	| LPAREN exp1 RPAREN {$$ = $2}
	;
