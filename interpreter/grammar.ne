@{%
import { Lexer } from './lexer.js';

const lexer = new Lexer('', null).initLexer().moo;
%}

# Pass your lexer object using the @lexer option:
@lexer lexer

Block -> Prop "," Block          {% d => [d[0], ...d[2]] %}  # flattens the tree of arrays
	| Prop:?                      {% d => d[0] ? d : [] %}   # if empty, return empty array
Prop -> Key ":" Val              {% d => ({type:'property', key: d[0], val: d[2]}) %}
Key -> [a-z]:+                   {% d => d[0].join("") %}
Val -> [a-z]:+                   {% d => d[0].join("") %}
	| "(" Block ")"               {% d => d[1] %}
	| "{" Block "}"               {% d => d[1] %}            # "{" and "}" are for indented blocks

# note that it's possible for parameters to show up both outside the block, and inside the block
# so we have to check for in post-parsing

# note that since braced blocks and indented blocks have different rules for where the "template" keyword can go,
# so we have to check in post-processing

Block 		-> Params:? (Statement (","|"\n")):* Statement:?		# note: trailing commas allowed

Params		-> VarList ">>"
VarList		-> (%identifier ",":?):* %identifier					# commas optional, but no trailing commas allowed

Statement	-> %identifier ":" Object								# properties
			| "[" %identifier "]" ":" Object						# dynamic keys (TODO: support destructuring)
			| Item:+												# one or more non-comma-separated items
			| "tag" %tag											# declaring tags
			| Object %propAccess %tag ":" Object					# setting tags
			| Object "<:" Object									# insertion

Object 		-> "(" Block ")"										# creation
			| "template":? Params:? "{" Block "}"					# creation
			| Object "(" Block ")"									# cloning
			| Object "template":? "{ Block "}"						# cloning

items		-> %identifier|%privateVar								# list items
			| (%identifier|%privateVar) %period						# true statements
			| (%identifier|%privateVar) "^^"						# shorthand property names

Object 		-> Object %propAccess %identifier						# notice, no private vars allowed
			| Object %propAccess %tag
			| Object "[" BracketBlock "]"							# property access
			| %identifier|%privateVar
			| %string|%number

Object 	-> Object Op Object											# operators (TODO: operator precedence)
Statemnt -> "if" "(" Object ")" Object "else" Object				# conditionals
Statemnt -> "for" VarList "in" Object ":" "{" Block "}"				# for-loop
