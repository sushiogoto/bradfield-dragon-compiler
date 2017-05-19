%%
\s+                   /* skip whitespace */
\/\/[^\n]*            /* skip comments */

[0-9]+                 return 'NUM'
\-                     return 'SUB'
\+                     return 'ADD'
\*                     return 'MUL'
\/                     return 'DIV'
\(                     return 'LPAREN'
\)                     return 'RPAREN'
\;                     return 'SC'
\=                     return 'ASSIGN'

dgn                    return 'DGN'
dprint                 return 'DPRINT'
return                 return 'RETURN'
while                  return 'WHILE'
if                     return 'IF'
else                   return 'ELSE'

[_a-zA-Z][_a-zA-Z0-9]* return 'IDENTIFIER'
\<                     return 'LT'
\{                     return 'LCURLY'
\}                     return 'RCURLY'
\'[^']*\'              return 'STRING'
\,                     return 'COMMA'
<<EOF>>                return 'EOF'
.                      return 'INVALID'
