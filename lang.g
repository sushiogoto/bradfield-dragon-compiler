%parse-param af
%start program
%%

program
	: fns EOF {return af.root($1)}
	;

fns
	: fn { $$ = [$1] }
	| fns fn { $1.push($2); $$ = $1 }
	;

fn
	: DGN IDENTIFIER LPAREN RPAREN LCURLY stmts RCURLY {$$ = af.fn($2, [], $6)}
	;

stmts
	: stmt { $$ = [$1] }
	| stmts stmt { $1.push($2); $$ = $1 }
	;

stmt
	: DPRINT exp1 SC { $$ = af.dprint($2) }
	| RETURN exp1 SC { $$ = af.ret($2) }
	| exp1 SC { $$ = $1 }
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
	| IDENTIFIER LPAREN RPAREN { $$ = af.call($1, []) }
	;
