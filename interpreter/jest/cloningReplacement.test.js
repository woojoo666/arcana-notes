import { Interpreter } from '../interpreter.js';

test('behavior overridden during cloning should not be cloned, even if it contains side effects.', () => {
    // note: in the clone, we override `x` and `y` to make it easier to tell if the clone is re-inserting those values or not.
    const testCode = 'collect: collector, foo: (x: 5, y: 7, insertX: (collect <: x), insertY: (collect <: y)), clone: foo(x: 15, y: 17, insertX: ())';
    const output = new Interpreter(testCode).interpretTest({}, 'Indent');

    // collector should now contain [5, 7, 17]
	const items = Object.entries(output.properties.collect.properties)
        .filter(([key,node]) => key != 'length') // filter out the length property
        .map(([key,node]) => node.value);        // extract values

    expect(items).toHaveLength(3);
    expect(items).toContain(5);
    expect(items).toContain(7);
    expect(items).toContain(17);
    expect(items).not.toContain(15);
});
