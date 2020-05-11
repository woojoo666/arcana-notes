import { Interpreter, Scope } from '../interpreter.js';

const interpret = src => new Interpreter(src).interpretTest();

test('unordered properties', () => {
    expect(interpret('foo: 100, bar: foo').get('bar')).toEqual(100);
    expect(interpret('bar: foo, foo: 100').get('bar')).toEqual(100);
});

test('numbers', () => {
    const output = interpret('foo: 100');
    expect(output.get('foo')).toEqual(100);
});

test('booleans', () => {
    const output = interpret('foo: true, bar: false');
    expect(output.get('foo')).toEqual(true);
    expect(output.get('bar')).toEqual(false);
});

test('strings', () => {
	expect(interpret('x: ""').get('x')).toEqual('');
	expect(interpret('x: "hi"').get('x')).toEqual('hi');
	expect(interpret('x: "pekora be like \\"ha↑ha↑ha↑\\""').get('x')).toEqual('pekora be like "ha↑ha↑ha↑"'); // test escaped quotes and special characters
})

test('numeric keys', () => {
    const output = interpret('100: "hi"');
    expect(output.get(100)).toEqual("hi");
});

test('boolean keys', () => {
    const output = interpret('true: "hi"');
    expect(output.get(true)).toEqual("hi");

	const output2 = interpret('conditional: (true: 1, false: 0), cond: true, result: conditional[cond]');
	expect(output2.get('result')).toEqual(1);
});

test('property access', () => {
    expect(interpret('x: (foo: 100), bar: x.foo').get('bar')).toEqual(100);
    expect(interpret('bar: (foo: 100).foo').get('bar')).toEqual(100); // inline property access
});

test('computed property access', () => {
    // note: in the clone, we override `x` and `y` to make it easier to tell if the clone is re-inserting those values or not.
    const output = interpret('foo: (100: "hi"), bar: foo[30+70]');
    expect(output.get('bar')).toEqual("hi");

    expect(interpret('bar: (foo: 100)["foo"]').get('bar')).toEqual(100); // inline computed property access

    const output2 = interpret('foo: (100: "hi"), key: 100, bar: foo[key]');
    expect(output2.get('bar')).toEqual("hi");
});

// Setting value using numeric key, getting value using string key, should return undefined
// do we really want this? in javascript, all literal keys are converted to strings
test('numeric vs string keys', () => {
    const output = interpret('foo: (100: "hi"), bar: foo["100"]');
    expect(output.get('bar')).toBeUndefined();
})
