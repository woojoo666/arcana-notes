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

	// there are 4 unary ops, !!, !, +, and -
	// unary operators have to be preceded by whitespace/comma/openbrace, and followed by a word/openbrace
	// TODO: update unary rules to follow the rules outlined in "Unary Operators and Ambiguity V"
	unary_op: /(?<=^|\s|\,|\(|\[)(\!\!|[!+-])(?=\w|\()/,

	operator:  /[\!\+\-\*\/\<\=\>\&\|]+/,  // capture all operator sequences, the grammar will detect invalid ones

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

	run () {
		this.initLexer();

		let tokens = [];

		function lastToken () {
			return tokens[tokens.length-1];
		}

		for (let token of this.moo) {
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
		while (tokens.length > 0 && lastToken().type == 'newline') {
			tokens.pop();
		}

		this.tokens = tokens;
		return this;
	}
}

export { Lexer };
