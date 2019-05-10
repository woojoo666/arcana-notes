@{%
const lexer = {
	next () {
		let token = this.tokens[this.index];
		this.index++;
		return token;
	},
	save() {
		return null;
	},
	reset (chunk) {
		this.tokens = chunk.split(',').map((str,ind) => {value: token, index: ind});
		this.index = 0;
	},
	formatError (token) {
		return 'error at token #' + token.index;
	},
	has (name) {
		return name == 'identifier'
	}
}
%}
@lexer lexer

main -> %identifier:+
