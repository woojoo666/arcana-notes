import { moo } from './mooModule.js';

let rules = {
	WS:      /[^\S\n]+/,
	comment: /\/\/.*?$/,
	number:  /[0-9]+/,
	string:  /"(?:\\["\\]|[^\n"\\])*"/,
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

	operator: ['!','+','-','**','*','/','%','<=','>=','<','>','==','=','!=','!==','&','|'],

	colon: ':',
	propAccess: /\.(?=\w|\#)/,
	period: '.',
	newline: { match: /\n/, lineBreaks: true },
	comma: ',',
	tag: /\#\w+/,
	identifier: { match: /\w+/ , type: moo.keywords({
			keyword: ['for', 'in', 'if', 'else', 'while', 'template', 'tag'],
		})},
};

// these are all the tokens that can precede unary operators at the start of an expression,
// used for detecting leading unary operators
const expressionStartTokens = ['(','[','{',':','<:','=>','\n',',','if','in'];

// these are all the types of tokens that can precede unary operators inside an expression
const unaryStartTokens = ['WS','operator','unary_op'];

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

	run () {
		this.initLexer();

		let tokens = [];
		let lastThreeTokens = []; // lastThreeTokens includes whitespace tokens, used for unary operator detection

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

			switch (token.type) {
				case 'WS':
				case 'comment': continue; // ignore whitespace and comments

				case 'newline':
					if (this.blockType == 'Braces') continue;    // ignore newlines in braced blocks
					if (tokens.length == 0) continue;       // ignore leading newlines
					if (lastToken().type == 'newline') continue; // ignore multiple newlines
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

export { Lexer };
