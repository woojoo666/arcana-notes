import { Lexer } from '../lexer';

function getOperatorTypes(source, blockType = 'Braces') {
	let lexer = new Lexer(source, blockType);
	return lexer.run().tokens
		.map(token => token.type)
		.filter(type => type == 'operator' || type == 'spaced_unary' || type == 'unary_op');
}

test('detect unary operators in expressions', () => {
	expect(getOperatorTypes('1-2')).toEqual(['operator']);
	expect(getOperatorTypes('1- 2')).toEqual(['operator']);
	expect(getOperatorTypes('1 -2')).toEqual(['unary_op']);
	expect(getOperatorTypes('1 - 2')).toEqual(['operator']);
	expect(getOperatorTypes('1*-2')).toEqual(['operator', 'unary_op']);
	expect(getOperatorTypes('1 * - 2')).toEqual(['operator', 'spaced_unary']);
	expect(getOperatorTypes('(1+2)-3')).toEqual(['operator', 'operator']);
	expect(getOperatorTypes('-3')).toEqual(['unary_op']);
	expect(getOperatorTypes('(-3)')).toEqual(['unary_op']);
	expect(getOperatorTypes('a | !!b')).toEqual(['operator', 'unary_op', 'unary_op']);
	expect(getOperatorTypes('!true')).toEqual(['unary_op']);
	expect(getOperatorTypes('!!true')).toEqual(['unary_op', 'unary_op']);
	expect(getOperatorTypes('! !true')).toEqual(['spaced_unary', 'unary_op']);
	expect(getOperatorTypes('! ! true')).toEqual(['spaced_unary', 'spaced_unary']);
	expect(getOperatorTypes('! !! true')).toEqual(['spaced_unary', 'unary_op', 'spaced_unary']);
	expect(getOperatorTypes('foo(1 2)-3')).toEqual(['operator']);
	expect(getOperatorTypes('fn(1 2)-> - 3')).toEqual(['operator']);
	expect(getOperatorTypes('fn(1 2)-> -3')).toEqual(['unary_op']);
	expect(getOperatorTypes('fn(1 2)->-3')).toEqual(['operator']);

	expect(getOperatorTypes('if (x > 3): (-1+2) else (-3+4)')).toEqual(['operator', 'unary_op', 'operator', 'unary_op', 'operator']);
	expect(getOperatorTypes('! x ? ! x else ! x')).toEqual(['spaced_unary', 'spaced_unary', 'spaced_unary']);
});
