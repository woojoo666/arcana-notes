import { Interpreter, Scope } from '../interpreter.js';

test('numbers', () => {
    const testCode = 'foo: 5';
    const output = new Interpreter(testCode).interpretTest();
    expect(output.get('foo')).toEqual(5);
});

test('booleans', () => {
    const testCode = 'foo: true';
    const output = new Interpreter(testCode).interpretTest();
    expect(output.get('foo')).toEqual(true);
});

test('numeric keys', () => {
    const testCode = '5: 888';
    const output = new Interpreter(testCode).interpretTest();
    expect(output.get(5)).toEqual(888);
});

// do we really want this? in javascript, all literal keys are converted to strings
test('numeric vs string keys', () => {
    // TODO: when we get support for string literals, change this to 'foo(5: 888), bar: foo["5"]' to make it more obvious how this mechanism can be confusing
    const testCode = 'foo(5: 888)';
    const output = new Interpreter(testCode).interpretTest();
    expect(output.get('5')).toBeUndefined();
})

test('computed property access', () => {
    // note: in the clone, we override `x` and `y` to make it easier to tell if the clone is re-inserting those values or not.
    const testCode = 'foo: (5: 888), bar: foo[2+3]';
    const output = new Interpreter(testCode).interpretTest();

    expect(output.get('bar')).toEqual(888);
});
