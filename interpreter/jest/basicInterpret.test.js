import { Interpreter, Scope } from '../interpreter.js';

const interpret = src => new Interpreter(src).interpretTest();

test('unordered properties', () => {
    expect(interpret('foo: 100, bar: foo').get('bar')).toEqual(100);
    expect(interpret('bar: foo, foo: 100').get('bar')).toEqual(100);
});

test('indentation', () => {
    expect(interpret('foo:\n\tbar: 100').get('foo').get('bar')).toEqual(100);
    expect(interpret('obj1:\n\tx: 100\nobj2:\n\ty:100').get('obj2').get('y')).toEqual(100);
    // TODO: more indentation tests?
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

test('"undefined" literal', () => {
	expect(interpret('x: undefined').get('x')).toEqual(undefined);
});

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

// TODO: undefined as a key??

test('property access', () => {
    expect(interpret('x: (foo: 100), bar: x.foo').get('bar')).toEqual(100);
    expect(interpret('bar: (foo: 100).foo').get('bar')).toEqual(100);         // inline property access
    expect(interpret('foo: (), bar: foo(x: 100).x').get('bar')).toEqual(100); // inline clone + property access
});

test('computed property access', () => {
    // note: in the clone, we override `x` and `y` to make it easier to tell if the clone is re-inserting those values or not.
    const output = interpret('foo: (100: "hi"), bar: foo[30+70]');
    expect(output.get('bar')).toEqual("hi");

    expect(interpret('bar: (foo: 100)["foo"]').get('bar')).toEqual(100);         // inline computed property access
    expect(interpret('foo: (), bar: foo(x: 100)["x"]').get('bar')).toEqual(100); // inline clone + computed property access

    const output2 = interpret('foo: (100: "hi"), key: 100, bar: foo[key]');
    expect(output2.get('bar')).toEqual("hi");
});

// Setting value using numeric key, getting value using string key, should return undefined
// do we really want this? in javascript, all literal keys are converted to strings
test('numeric vs string keys', () => {
    const output = interpret('foo: (100: "hi"), bar: foo["100"]');
    expect(output.get('bar')).toBeUndefined();
});

test('handling undefined', () => {
    expect(interpret('foo: bar').get('foo')).toEqual(undefined);               // undefined reference

    expect(interpret('foo: bar.x').get('foo')).toEqual(undefined);             // prop access: undefined source
    expect(interpret('foo: (), bar: foo.x').get('bar')).toEqual(undefined);    // prop access: undefined prop value
    expect(interpret('foo: bar[5]').get('foo')).toEqual(undefined);            // prop access: computed prop access
    expect(interpret('foo: (), bar: foo[key]').get('bar')).toEqual(undefined); // prop access: undefined key
    expect(interpret('foo: bar[key]').get('foo')).toEqual(undefined);          // prop access: undefined source and key

    expect(interpret('foo: x+y').get('foo')).toEqual(undefined);               // operators: sum. TODO: right now this just returns undefined, maybe we should return NaN?
    expect(interpret('foo: "" == undefined').get('foo')).toEqual(false);       // operators: reference equality
    expect(interpret('foo: undefined == undefined').get('foo')).toEqual(true); // operators: reference equality
    // TODO: when we support coercing to boolean, test boolean operators, eg `foo: !x` should return `foo = true`

    expect(interpret('foo: bar()').get('foo')).toEqual(undefined);                        // cloning: undefined source
    expect(interpret('foo: (), bar: foo(x: y).x').get('bar')).toEqual(undefined);         // cloning: undefined reference in arguments
    expect(interpret('foo: (x: undefined), bar: foo(x: 100).x').get('bar')).toEqual(100); // cloning: replacing undefined literal

    expect(interpret('foo: (res: x == undefined), bar: foo(x: undefined).res').get('bar')).toEqual(true); // special edge case, make sure undefined nodes get cloned properly

    // replacing with undefined. See section "Replacement and Undefined Properties"
    expect(interpret('foo: (x: 100), bar: foo(x: undefined).x').get('bar')).toEqual(undefined); // cloning: replacing with undefined literal
    expect(interpret('foo: (x: 100), bar: foo(x: ref)').get('x')).toEqual(undefined);           // cloning: replacing with undefined reference
    // TODO: when we support passing in arguments object directly, support undefined arguments object, eg `foo: clone(bar, undefined)`

    // TODO: when we support computed properties, test undefined computed prop, eg `[undefined]: 100` and `[foo]: 100` (where foo is undefined)
});

test('functions', () => {
    expect(interpret('=> 100').get('_return')).toEqual(100);
    expect(interpret('x: (=> 100), y: x()->').get('y')).toEqual(100);
});

test('self reference using "this"', () => {
    expect(interpret('x: 100, y: this.x').get('y')).toEqual(100);
    expect(interpret('foo: (x: 100), clone: foo(y: this.x), bar: clone.y').get('bar')).toEqual(100); // test self reference in cloning
})

// TODO: test cloning (remember to test cloning primitives)
// TODO: test insertion and inserting undefined
// TODO: test binops and unary ops
// TODO: test feedback
// TODO: test recursion
