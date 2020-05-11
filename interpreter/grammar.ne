# indent-width: 4 (for vertical alignment)

@{%
const lexerWrapper = (typeof module === 'object' && module.exports)
						? require('./lexerWrapper.js')
						: window.lexerWrapper;
%}
@lexer lexerWrapper
@preprocessor module # generate grammar as esmodule

# Note that some things are either impossible to check in the grammar (due to modular parsing), or just more difficult.
# So we defer some of these checks to post-grammar parsing.

# Checks deferred to post-process:
#	parameters can be declared inside or outside the block, but not both
#	braced blocks and indented blocks have different rules for where the "template" keyword can go
#	nested blocks with special restrictions, eg:
#		for bracket property access, the bracket block actually has to be a one-item list
#		for object destructuring, 
#	private identifiers can't be used in property access, eg `foo._bar`
#   when stripping parenthesis, the block inside must be a single-item list

Block 		-> Params:? (Statement (","|"\n")):* Statement:?		{% ([parameters,middle,last]) => ({type:'block', parameters, statements: last ? [...middle.map(x=>x[0]),last] : middle.map(x=>x[0])}) %} # trailing commas allowed

Params		-> VarList ">>"											{% ([varlist]) => varlist %}
VarList		-> (%identifier ",":?):* %identifier					{% ([middle,last]) => [...middle.map(([x])=>x.value),last.value] %} # commas optional, but no trailing commas allowed

Statement	-> %identifier ":" Expression							{% ([token, ,value]) => ({type:'property', key: token.value, value}) %} # (TODO: support destructuring)
			| %number ":" Expression								{% ([token, ,value]) => ({type:'property', key: token.value, value, keyType: 'number'}) %} # TODO: invalid numeric keys like "1.2.3" should return syntax error, though perhaps easier to throw in the interpreter
			| %boolean ":" Expression								{% ([token, ,value]) => ({type:'property', key: token.value, value, keyType: 'boolean'}) %}
			| "[" %identifier "]" ":" Expression					# dynamic keys / computed properties (TODO: support destructuring)
			| SpacedItem:+											{% ([items]) => ({type:'subList', items}) %} # one or more space-delimited list items
			| SpacedUnary											# a single spaced-unary object
			| "tag" %tag											# declaring tags

			| Object %propAccess %tag ":" Expression				# setting tags
			| Object "<:" Expression								{% ([target, ,value]) => ({type:'insertion', target, value}) %}

			| "if" Expression ":" BracedBlock ("else" BracedBlock):?	# conditionals
			| "for" VarList "in" Expression ":" BracedBlock			# for-loop (TODO: support destructuring)

			| "=>" Expression										{% ([ ,value]) => ({type:'property', key: '_return', value}) %} 
																	# TODO: returns are not allowed to have commas beforehand,
																	#       so this may need to be moved to the "Block" rule

BracedBlock ->	"(" Block ")"             {% d => d[1] %}
			| "{" Block "}"               {% d => d[1] %}           # "{" and "}" are for indented blocks

SpacedItem	-> Ternary												# note that spaced list items cannot be SpacedUnary objects
			| %identifier %period									# true statements
			| %identifier "^^"										# shorthand property names
			| ("..."|"…") Object										# spread operator

# note: using Javascript operator precedence:
#	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence

# the following rules are for expressions and operators, starting from lowest precedence
# note that any expression can also be a single spaced-unary object
Expression	-> Ternary												{% id %}
			| SpacedUnary											{% id %}

Ternary		-> Or "?" Ternary "else" Ternary						{% ([condition, ,trueBranch, ,falseBranch]) => ({type:'ternary',condition,trueBranch,falseBranch}) %} # right associative
			| Or													{% id %}

# TODO: we might be able to convert each operator to be like `Or -> (And "|"):* And`
# that way operator precedence can be handled in post-processing, and we only have a single rule for each operator

Or			-> Or "|" And											{% ([left,op,right]) => ({type:'binop',operator: op.value,left,right}) %}
			| And													{% id %}
And			-> And "&" Eq											{% ([left,op,right]) => ({type:'binop',operator: op.value,left,right}) %}
			| Eq													{% id %}

Eq			-> Eq ("=="|"="|"!=="|"!=") Compare						{% ([left,op,right]) => ({type:'binop',operator: op[0].value,left,right}) %}
			| Compare												{% id %}
Compare		-> Compare ("<="|">="|"<"|">") Sum						{% ([left,op,right]) => ({type:'binop',operator: op[0].value,left,right}) %}
			| Sum													{% id %}

Sum			-> Sum ("+"|"-") Product								{% ([left,op,right]) => ({type:'binop',operator: op[0].value,left,right}) %}
			| Product												{% id %}
Product		-> Product ("*"|"/"|"%") Exp							{% ([left,op,right]) => ({type:'binop',operator: op[0].value,left,right}) %}
			| Exp													{% id %}
Exp			-> Unary "**" Exp										{% ([left,op,right]) => ({type:'binop',operator: op.value,left,right}) %}	# right associative
			| Unary													{% id %}

Unary		-> %unary_op Unary										{% ([op,value]) => ({type:'unaryop',operator: op.value,value}) %}
			| Object												{% id %}

SpacedUnary	-> %unary_op:* %spaced_unary %unary_op:* Object         # at least one spaced_unary, and exactly one operand

Object 		-> "(" Block ")"										{% ([ ,block, ]) => ({type:'create',block}) %}
			| "template":? Params:? "{" Block "}"					{% ([templ,parameters, ,block, ]) => ({type:'create',block,template: !!templ,parameters}) %}
			| Object "(" Block ")"									{% ([source, ,block, ]) => ({type:'clone',source,block}) %}
			| Object "template":? "{" Block "}"						{% ([source,templ, ,block, ]) => ({type:'clone',source,block,template: !!templ}) %}

			| Object "->"											{% ([source]) => ({type:'memberAccess',source,key:'_return'}) %} # calling
			| Object %propAccess %identifier						{% ([source, ,token]) => ({type:'memberAccess',source,key:token.value}) %}
			| Object %propAccess %tag
			| Object "[" Expression "]"								{% ([source, ,key, ]) => ({type:'memberAccess',source,key}) %}

			| "..."													# capture block

			| "collector"											{% ([token]) => ({type:'collector'}) %}
			| %identifier											{% ([token]) => ({type:'reference', name: token.value}) %}
			| %string												{% ([token]) => ({type:'string', value: token.value}) %}
			| %number												{% ([token]) => ({type:'number', value: token.value}) %}
			| %boolean												{% ([token]) => ({type:'boolean', value: token.value}) %}
			| %undefined											{% ([token]) => ({type:'undefined', value: token.value}) %}
