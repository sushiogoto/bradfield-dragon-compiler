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

dgn                    return 'DGN'
dprint                 return 'DPRINT'
return                 return 'RETURN'
while                  return 'WHILE'
if                     return 'IF'
else                   return 'ELSE'

[_a-zA-Z][_a-zA-Z0-9]* return 'IDENTIFIER'

\=\=                   return 'EQ'
\<\=                   return 'LTE'
\>\=                   return 'GTE'
\<                     return 'LT'
\>                     return 'GT'

\=                     return 'ASSIGN'

\%                     return 'MOD'

\&\&                   return 'AND'

\{                     return 'LCURLY'
\}                     return 'RCURLY'
\'[^']*\'              return 'STRING'
\,                     return 'COMMA'
<<EOF>>                return 'EOF'
.                      return 'INVALID'
