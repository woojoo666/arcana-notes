// TODO: add tests for lexer
import { Lexer } from '../lexer';

// TODO: add tests for unary op and binary op prediction


	let preprocessor = new PreProcessor(src);
	preprocessor.run();
	window.preprocessor = preprocessor;

	function lexRecursive(block) {
		console.table(lexer.run().tokens);
		block.children.forEach(lexRecursive);
	}

expect.extend({
	toMatchOperatorTypes(received, delimiterStr) {
		let array = [...received];
		let stripped = array.map(obj => {
			delete obj.offset;
			delete obj.matchText;
			return obj;
		});
		let pass = this.equals(stripped, fromDelimiterString(delimiterStr));
		return {
			message: () => `expected iterable to ${pass ? 'not ' : ''}match delimiter string \"${delimiterStr}\"`,
			pass: pass,
		};
	}
});

function getOperatorTypes(source, blockType = 'Braces') {
	let lexer = new Lexer(source, blockType);
	return lexer.run().tokens
		.map(token => token.type)
		.filter(type => type == 'all_ops' || type == 'unary_op');
}

test('detect binary/unary operators in expressions', () => {
	expect(getOperatorTypes('1-2')).toEqual(['all_ops']);
	expect(getOperatorTypes('1- 2')).toEqual(['all_ops']);
	expect(getOperatorTypes('1 -2')).toEqual(['unary_op']);
	expect(getOperatorTypes('1 - 2')).toEqual(['all_ops']);
	expect(getOperatorTypes('1*-2')).toEqual(['all_ops','unary_op']);
	expect(getOperatorTypes('(1+2)-3')).toEqual(['all_ops','all_ops']);
	expect(getOperatorTypes('-3')).toEqual(['all_ops']);      // unary expressions are left for the grammar to detect
	expect(getOperatorTypes('(-3)')).toEqual(['all_ops']);
	expect(getOperatorTypes('a | !!b')).toEqual(['all_ops','unary_op','unary_op']);
	expect(getOperatorTypes('a | ! !b')).toEqual(['all_ops','all_ops','unary_op']);
	expect(getOperatorTypes('!true')).toEqual(['all_ops']);
	expect(getOperatorTypes('!!true')).toEqual(['all_ops']);
	expect(getOperatorTypes('! !true')).toEqual(['all_ops','unary_op']);
	expect(getOperatorTypes('! ! true')).toEqual(['all_ops','all_ops']);
	expect(getOperatorTypes('foo(1 2)-3')).toEqual([]);
	expect(getOperatorTypes('fn(1 2)-> - 3')).toEqual([]);
	expect(getOperatorTypes('fn(1 2)-> -3')).toEqual([]);
	expect(getOperatorTypes('fn(1 2)->-3')).toEqual([]);
});
