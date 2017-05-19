%parse-param af
%start program

// Since if and if-else can take any statements, and if/if-else are both
// statements themselves, this grammar is ambiguous about situations where they
// are combined without braces. For example, when given the string
//
// if (10) doA() else if (15) doB() else doC()
//
// "else doC()" could be paired with "if (10)" or with "if (15)". The
// "%right" instruction below is used in combination with the "%prec"
// instructions on the action productions to tell Jison how to resolve the
// conflict
//
// I found this method at http://stackoverflow.com/questions/12731922/reforming-the-grammar-to-remove-shift-reduce-conflict-in-if-then-else/12734499#12734499
//
// This specific problem is actually mentioned in the dragon book, in
// section4.3.2
%right THEN ELSE
%%

program
	: fns EOF {return af.root($1)}
	;

fns
	: fn { $$ = [$1] }
	| fns fn { $1.push($2); $$ = $1 }
	;

fn
	: DGN IDENTIFIER param_list LCURLY stmts RCURLY {$$ = af.fn($2, $3, $5)}
	;

param_list
	: LPAREN RPAREN { $$ = [] }
	| LPAREN params RPAREN { $$ = $2 }
	;

params
	: param { $$ = [$1] }
	| params COMMA param { $1.push($3); $$ = $1 }
	;

param
	: IDENTIFIER
	;

stmts
	: stmt { $$ = [$1] }
	| stmts stmt { $1.push($2); $$ = $1 }
	;

stmt
	: DPRINT exp0 SC { $$ = af.dprint($2) }
	| RETURN exp0 SC { $$ = af.ret($2) }
	| IF LPAREN exp0 RPAREN stmt   %prec THEN { $$ = af.if($3, $5) }
	| IF LPAREN exp0 RPAREN stmt ELSE stmt   %prec ELSE { $$ = af.ifElse($3, $5, $7) }
	| WHILE LPAREN exp0 RPAREN stmt { $$ = af.while($3, $5) }
	| exp0 SC { $$ = af.exprStmt($1) }
	| LCURLY stmts RCURLY { $$ = af.block($2) }
	| SC { $$ = af.emptyStmt() }
	;

exp0
	: and
	| IDENTIFIER ASSIGN and { $$ = af.assign($1, $3) }
	;

and
	: comparison
	| and AND comparison { $$ = af.op($2, $1, $3) }
	;

comparison
	: inequality
	| comparison EQ inequality { $$ = af.op($2, $1, $3) }
	;

inequality
	: exp1
	| inequality LT exp1 { $$ = af.op($2, $1, $3) }
	| inequality GT exp1 { $$ = af.op($2, $1, $3) }
	| inequality LTE exp1 { $$ = af.op($2, $1, $3) }
	| inequality GTE exp1 { $$ = af.op($2, $1, $3) }
	;

exp1
	: exp2
	| exp1 ADD exp2 { $$ = af.op($2, $1, $3)}
	| exp1 SUB exp2 { $$ = af.op($2, $1, $3)}
	;

exp2
	: exp3
	| exp2 MUL exp3 { $$ = af.op($2, $1, $3)} 
	| exp2 DIV exp3 { $$ = af.op($2, $1, $3)}
	| exp2 MOD exp3 { $$ = af.op($2, $1, $3)}
	;

exp3
	: NUM {$$ = af.num($1)}
	| STRING { $$ = af.string($1.slice(1, $1.length - 1)) }
	| IDENTIFIER { $$ = af.id($1) }
	| LPAREN exp0 RPAREN {$$ = $2}
	| IDENTIFIER arg_list { $$ = af.call($1, $2) }
	;

arg_list
	: LPAREN RPAREN { $$ = [] }
	| LPAREN args RPAREN { $$ = $2 }
	;

args
	: exp0 { $$ = [$1] }
	| args COMMA exp0 { $1.push($3); $$ = $1 }
	;
