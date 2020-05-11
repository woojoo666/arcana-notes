
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
});

test('"undefined" literal', () => {
	expect(parse('x: undefined').statements[0].value.type).toEqual('undefined');
});

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

test('property access', () => {
    expect(parse('bar: x.foo').statements[0].value.type).toEqual('memberAccess');
    expect(parse('bar: (foo: 100).foo').statements[0].value.type).toEqual('memberAccess'); // inline property access
    expect(parse('bar: foo(x: 100).x').statements[0].value.type).toEqual('memberAccess');  // inline clone + property access
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

    expect(parse('bar: (x: 100)["x"]').statements[0].value.type).toEqual('memberAccess');    // inline computed property access
    expect(parse('bar: foo(x: 100)["x"]').statements[0].value.type).toEqual('memberAccess'); // inline clone + computed property access
});
