import { Interpreter, Scope, ObjectNode, ReferenceNode } from '../interpreter.js';

import { validateCollector, getItems } from './utils.js';

// when a clone is re-evaluated, the previous child should be destroyed, and propagate the destruction to all descendents
test('destructor calls should propagate when clone node re-evaluates', () => {

    const testCode = `
        collect: collector
        EMPTY_OBJ: ()

        input: EMPTY_OBJ

        clone: input
            collect <: 1                // direct insertion
            a: (collect <: 2)           // insertion within property
            b: ()(collect <: 3)         // insertion within clone args
            c: (collect <: 4)()         // insertion within clone source (will insert 4 twice)
            d: "hi" == (collect <: 5)   // insertion within binop
            e: !(collect <: 6)          // insertion within unary
            f: (collect <: 7).foo       // insertion within member access
            g: foo[(collect <: 8)]      // insertion within computed property access

            collect <: undefinedRef  // insert undefined

            // todo: test insertions within list items
    `;
    const output = new Interpreter(testCode).interpretTest();

    // collector should contain [1, 2, 3, 4, 4, 5, 6, 7, 8]
    validateCollector(output.get('collect'));
    let items = getItems(output.get('collect'));

    expect(items).toHaveLength(10);
    expect(items).toContain(1);
    expect(items).toContain(2);
    expect(items).toContain(3);
    expect(items).toContain(4);
    expect(items).toContain(5);
    expect(items).toContain(6);
    expect(items).toContain(7);
    expect(items).toContain(8);
    expect(items).toContain(undefined);

    const inputRef = output.getNode('input'); // get reference node
	inputRef.target = undefined;
    inputRef.update();

    // items should be empty now
    validateCollector(output.get('collect'));
    items = getItems(output.get('collect'));

    expect(items).toHaveLength(0);

    inputRef.target = output.get('EMPTY_OBJ');
    inputRef.update();

    validateCollector(output.get('collect'));
    items = getItems(output.get('collect'));

    expect(items).toHaveLength(10); // test that items have been restored
});

// test switching the clone source to a different object with different insertions
// test changing the clone arguments
