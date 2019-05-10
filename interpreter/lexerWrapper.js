import { Lexer, rules } from './lexer.js';

// wrap my Lexer class to conform to Nearley lexer interface (see https://nearley.js.org/docs/tokenizers)
// included an additional method, "setBlockType", which should be called before reset()
const lexerWrapper = {
	setBlockType (blockType) {
		this.blockType = blockType;
	},
	next () {
		let token = this.lexer.tokens[this.index];
		this.index++;
		return token;
	},
	save() {
		// my lexer does not support saving or restoring state
		return null;
	},
	reset (chunk) {
		this.lexer = new Lexer(chunk, this.blockType).run();
		this.index = 0;
	},
	formatError (token) {
		return this.lexer.moo.formatError(token);
	},
	has (name) {
		return rules.hasOwnProperty(name);
	}
};

// expose lexerWrapper as CommonJS module or browser variable, so it is accessible from grammar.js
if (typeof module === 'object' && module.exports) {
	module.exports = lexerWrapper;
} else { // if we aren't in Node.js, assume we are in the browser
	window.lexerWrapper = lexerWrapper;
}

export { lexerWrapper };
