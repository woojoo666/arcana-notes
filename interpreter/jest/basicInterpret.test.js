import { Interpreter, Scope } from '../interpreter.js';

const interpret = src => new Interpreter(src).interpretTest();

test('unordered properties', () => {
    expect(interpret('foo: 5, bar: foo').get('bar')).toEqual(5);
    expect(interpret('bar: foo, foo: 5').get('bar')).toEqual(5);
});

test('numbers', () => {
    const testCode = 'foo: 5';
    const output = new Interpreter(testCode).interpretTest();
    expect(output.get('foo')).toEqual(5);
});

test('booleans', () => {
    const testCode = 'foo: true, bar: false';
    const output = new Interpreter(testCode).interpretTest();
    expect(output.get('foo')).toEqual(true);
    expect(output.get('bar')).toEqual(false);
});

test('strings', () => {
	expect(interpret('x: ""').get('x')).toEqual('');
	expect(interpret('x: "hi"').get('x')).toEqual('hi');
	expect(interpret('x: "pekora be like \\"ha↑ha↑ha↑\\""').get('x')).toEqual('pekora be like "ha↑ha↑ha↑"'); // test escaped quotes and special characters
})

test('numeric keys', () => {
    const testCode = '5: 888';
    const output = new Interpreter(testCode).interpretTest();
    expect(output.get(5)).toEqual(888);
});

// Setting value using numeric key, getting value using string key, should return undefined
// do we really want this? in javascript, all literal keys are converted to strings
test('numeric vs string keys', () => {
    const output = interpret('foo: (5: "hi"), bar: foo["5"]');
    expect(output.get('bar')).toBeUndefined();
})

test('boolean keys', () => {
    const testCode = 'true: 888';
    const output = new Interpreter(testCode).interpretTest();
    expect(output.get(true)).toEqual(888);

	const testCode2 = 'conditional: (true: 1, false: 0), cond: true, result: conditional[cond]';
	const output2 = new Interpreter(testCode2).interpretTest();
	expect(output2.get('result')).toEqual(1);
});

test('property access', () => {
    expect(interpret('x: (foo: 5), bar: x.foo').get('bar')).toEqual(5);
    expect(interpret('bar: (foo: 5).foo').get('bar')).toEqual(5); // inline property access
});

test('computed property access', () => {
    // note: in the clone, we override `x` and `y` to make it easier to tell if the clone is re-inserting those values or not.
    const output = interpret('foo: (5: "hi"), bar: foo[2+3]');
    expect(output.get('bar')).toEqual("hi");

    expect(interpret('bar: (foo: 5)["foo"]').get('bar')).toEqual(5); // inline computed property access

    const output2 = interpret('foo: (5: "hi"), key: 5, bar: foo[key]');
    expect(output2.get('bar')).toEqual("hi");
});
