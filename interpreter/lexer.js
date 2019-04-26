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

	// there are 3 unary ops: !, +, and -
	// unary ops can be after whitespace or any operator
	// in other words, they cannot be after a word, quote, "->", or any closed-brace (")","]","}")
	// unary operators can be followed by anything but whitespace
	// the first lookbehind checks for whitespace and operators, the second makes sure it isn't after a "->" operator
	// note that the unary_op regex is not for catching unary ops at the beginning of statements, which can have whitespace
	unary_op: /(?<=\s|[!+\-*/%<=>&|])(?<!\-\>)[!+-](?=\S)/,

	all_ops: ['!','+','-','**','*','/','%','<=','>=','<','>','==','=','!=','!==','&','|'],

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
