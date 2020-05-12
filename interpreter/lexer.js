import { importCommonJS } from './utils.js';

const moo = importCommonJS('moo');

const keywords = {
	keyword: ['for', 'in', 'if', 'else', 'while', 'template', 'tag', 'collector'],
	boolean: ['true','false'],
	undefined: ['undefined'],
	selfRef: ['this'],
};

const rules = {
	WS:      /[^\S\n]+/,
	comment: /\/\/.*?$/,
	number:  /[0-9]+/, // TODO: support decimal numbers
	string:  /"(?:\\["\\]|[^\n"\\])*"/, // TODO: support single quotes
	params: '>>',
	return: '=>',
	getReturn: '->',
	insertion: '<:',

	lparen:  '(',
	rparen:  ')',
	indent:  '{',
	dedent:  '}',
	lbracket: '[',
	rbracket: ']',

	// these token types are assigned dynamically in the Lexer,
	// but we need to specify their names here so the grammar can detect them
	unary_op: [],
	spaced_unary: [],
	operator: ['!','+','-','**','*','/','%','<=','>=','<','>','==','=','!=','!==','&','|'],

	colon: ':',
	ternary: '?',
	propAccess: /\.(?=\w|\#)/,  // supports numbers for now, eg foo.15
	period: '.',
	newline: { match: /\n/, lineBreaks: true },
	comma: ',',
	tag: /\#\w+/,
	identifier: { match: /\w+/ , type: moo.keywords(keywords)},
};

// these are all the tokens that can precede unary operators at the start of an expression,
// used for detecting leading unary operators
const expressionStartTokens = ['(','[','{',':','<:','=>','\n',',','if','in','?','else'];

// these are all the types of tokens that can precede unary operators inside an expression
const unaryStartTokens = ['WS','operator','unary_op','spaced_unary'];

class Lexer {

	constructor (blockString, blockType) {
		this.blockString = blockString;
		this.blockType = blockType;  // blockType is used to figure out things like, should we ignore newlines
	}

	// also used in grammar
	initLexer () {
		this.moo = moo.compile(rules);
		this.moo.reset(this.blockString);
		return this;
	}

	// If the previous token was an operator, checks the token before and after it
	// to see if the operator was the first operator in an expression.
	unaryOperatorDetection (lastThreeTokens) {
		if (lastThreeTokens.length < 2) return; // unary operator detection needs at least two tokens

		let precedingToken = lastThreeTokens[2];
		let operator = lastThreeTokens[1];
		let followingToken = lastThreeTokens[0];

		if (operator.type != 'operator') return;
		if (followingToken.type == 'WS') return;

		if (precedingToken == undefined
				|| expressionStartTokens.includes(precedingToken.value)
				|| unaryStartTokens.includes(precedingToken.type)) {
			operator.type = 'unary_op';
		}
	}

	// note that "currentToken" may be whitespace, but "tokens" array does not include whitespace
	spacedUnaryDetection (currentToken, tokens) {
		if (tokens.length < 1) return; // needs at least one token

		let precedingToken = tokens[tokens.length-2];
		let operator = tokens[tokens.length-1];

		if (operator.type != 'operator') return;
		if (currentToken.type != 'WS') return;

		if (precedingToken == undefined
				|| expressionStartTokens.includes(precedingToken.value)
				|| unaryStartTokens.includes(precedingToken.type)) {
			operator.type = 'spaced_unary';
		}
	}

	// lexing rules for operators:
	//   unary_op:     no trailing whitespace, preceded by operator or whitespace or start of expression
	//   spaced_unary: trailing whitespace, first non-whitespace to the left is an operator or start of expression
	//   operator:     anything else
	// put another way:
	//     [whitespace or operator or expressionstart] [unary_op] [anything but whitespace]
	//     [operator or expressionstart] [whitespace]* [spaced_unary] [whitespace]
	// notice that unary and spaced_unary operator detection is not based on the operator character,
	// purely based on whitespace rules and preceding tokens.
	run () {
		this.initLexer();

		let tokens = [];
		let lastThreeTokens = []; // lastThreeTokens includes whitespace tokens, used for unary operator detection. First token is current token

		function lastToken () {
			if (tokens.length <= 0) return null;
			return tokens[tokens.length-1];
		}

		for (let token of this.moo) {
			lastThreeTokens.unshift(token);
			if (lastThreeTokens.length > 3) {
				lastThreeTokens.pop();
			}
			this.unaryOperatorDetection(lastThreeTokens);

			this.spacedUnaryDetection(token, tokens);

			switch (token.type) {
				case 'WS':
				case 'comment': continue; // ignore whitespace and comments

				// newlines are preserved in indented blocks to separate statements
				case 'newline':
					if (this.blockType == 'Braces') continue;    // ignore newlines in braced blocks
					if (tokens.length == 0) continue;       // ignore leading newlines
					if (lastToken().type == 'newline') continue; // ignore multiple newlines
					if (lastToken().type == 'indent') continue;  // ignore newlines after indent, TODO: not sure if actually needed, was added during a hotfix
					if (lastToken().type == 'comma') continue;   // newlines are ignored after commas
					break;
			}

			tokens.push(token);
		}

		// pop trailing newlines
		while (lastToken() && lastToken().type == 'newline') {
			tokens.pop();
		}

		this.tokens = tokens;
		return this;
	}
}

export { Lexer, rules, keywords };
