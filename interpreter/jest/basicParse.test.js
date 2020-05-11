
import { parse } from '../parser.js';

// todo: add test for all basic syntax, eg unary operators, templates, parameters, @-blocks, cloning, if-else, etc
test('booleans', () => {
	const testCode = 'x: true';
	let parsed = parse(testCode);
	console.log(JSON.stringify(parsed));
    expect(parsed.statements[0].value.type).toEqual('boolean');
    expect(parsed.statements[0].value.value).toEqual('true');
});

test('strings', () => {
	expect(parse('x: ""').statements[0].value.type).toEqual('string');
	expect(parse('x: "test"').statements[0].value.value).toEqual('\"test\"'); // notice that the AST preserves the original code of all primitives, including strings
	expect(parse('x: "pekora be like \\"ha↑ha↑ha↑\\""').statements[0].value.type).toEqual('string'); // test escaped quotes and special characters
})

test('numeric keys', () => {
    const testCode = '5: 888';
	let parsed = parse(testCode);
    expect(parsed.statements[0].key).toEqual('5');
});

// note: boolean keys are useful for implementing ternaries and conditionals
test('boolean keys', () => {
	const testCode = 'true: 888';
	let parsed = parse(testCode);
    expect(parsed.statements[0].key).toEqual('true');
});

test('computed property access', () => {
	let code = 'a: b[c]';
	let parsed = parse(code);

	expect(parsed).toMatchSnapshot();
	expect(parsed.statements[0].value.type).toEqual('memberAccess');
	expect(parsed.statements[0].value.key.type).toEqual('reference');

	let code2 = 'a: b[c + max(d,e)]';
	let parsed2 = parse(code2);
	expect(parsed2).toMatchSnapshot();
	expect(parsed2.statements[0].value.key.operator).toEqual('+');
	expect(parsed2.statements[0].value.key.right.type).toEqual('clone');
});
