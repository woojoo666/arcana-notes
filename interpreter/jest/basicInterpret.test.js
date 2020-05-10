import { Interpreter } from '../interpreter.js';

test('numbers', () => {
    const testCode = 'foo: 5';
    const output = new Interpreter(testCode).interpretTest({}, 'Indent');
    expect(output.properties.foo.value).toEqual(5);
});

test('numeric keys', () => {
    const testCode = '5: 888';
    const output = new Interpreter(testCode).interpretTest({}, 'Indent');
    expect(output.properties[5].value).toEqual(888);
});

test('computed property access', () => {
    // note: in the clone, we override `x` and `y` to make it easier to tell if the clone is re-inserting those values or not.
    const testCode = 'foo: (5: 888), bar: foo[2+3]';
    const output = new Interpreter(testCode).interpretTest({}, 'Indent');

    expect(output.properties.bar.value).toEqual(888);
});
