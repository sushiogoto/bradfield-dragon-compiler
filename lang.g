%parse-param af
%start program
%%
program
	: expression EOF {return $1}
	;
expression
	: num SUB LPAREN num ADD num RPAREN ADD num
	{return af.op($8, af.op($2, $1, af.op($5, $4, $6)), $9)}
	;
num
	: NUM -> af.num($1)
	;