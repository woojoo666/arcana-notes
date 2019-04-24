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


# Note that some things are either impossible to check in the grammar (due to modular parsing), or just more difficult.
# So we defer some of these checks to post-grammar parsing.

# Checks deferred to post-process:
#	parameters can be declared inside or outside the block, but not both
#	braced blocks and indented blocks have different rules for where the "template" keyword can go
#	nested blocks with special restrictions, eg:
#		in conditionals, the braced block actually has to be a one-item list
#		for bracket property access, the bracket block actually has to be a one-item list
#		for object destructuring, 
#	private identifiers can't be used in property access, eg `foo._bar`

Block 		-> Params:? (Statement (","|"\n")):* Statement:?		# note: trailing commas allowed

Params		-> VarList ">>"
VarList		-> (%identifier ",":?):* %identifier					# commas optional, but no trailing commas allowed

Statement	-> %identifier ":" Expression							# properties (TODO: support destructuring)
			| "[" %identifier "]" ":" Expression					# dynamic keys (TODO: support destructuring)
			| Item:+												# one or more space-delimited list items
			| Expression											# a single list item, can contain binary operators
			| "tag" %tag											# declaring tags

			| Object %propAccess %tag ":" Expression				# setting tags
			| Object "<:" Expression								# insertion

			| "if" "(" Block ")" Expression ("else" Expression):?	# conditionals
			| "for" VarList "in" Expression ":" "{" Block "}"		# for-loop (TODO: support destructuring)

			| "=>" Expression										# TODO: returns are not allowed to have commas beforehand,
																	#       so this may need to be moved to the "Block" rule

# TODO: update unary rules to follow the rules outlined in "Unary Operators and Ambiguity V"
Item		-> Unary												# space-delimited list items must be unary expr (no binary ops)
			| %identifier %period									# true statements
			| %identifier "^^"										# shorthand property names
			| ("..."|"…")Object										# spread operator

# note: using Javascript operator precedence:
#	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence

Expression	-> Or													# starting from lowest precedence

Or			-> Or "|" And | And
And			-> And "&" Eq | Eq

Eq			-> Eq ("=="|"="|"!=="|"!=") Compare | Compare
Compare		-> Compare ("<="|">="|"<"|">") Sum | Sum

Sum			-> Sum ("+"|"-") Product | Product
Product		-> Product ("*"|"/"|"%") Exp | Exp
Exp			-> Unary "**" Exp | Unary								# right associative

Unary		-> ("!"|"+"|"-") Unary | Object							# ambiguous! see section "Unary Operators and Ambiguity"


Object 		-> "(" Block ")"										# creation
			| "template":? Params:? "{" Block "}"					# creation
			| Object "(" Block ")"									# cloning
			| Object "(" Block ")" "->"								# calling
			| Object "template":? "{" Block "}"						# cloning

			| Object %propAccess %identifier						# notice, no private vars allowed
			| Object %propAccess %tag
			| Object "[" Block "]"									# computed property access

			| Object -> "..."										# capture block

			| %identifier | %string | %number
