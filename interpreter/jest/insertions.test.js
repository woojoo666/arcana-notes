import { Interpreter, Scope } from '../interpreter.js';

function extractItems (collector) {
    return [...collector.properties.entries()]
        .filter(([key,node]) => key != 'length') // filter out the length property
        .map(([key,node]) => node.value);        // extract values
}

test('insertions', () => {
    const testCode = `
        collect: collector

        collect <: 1                // direct insertion
        a: (collect <: 2)           // insertion within property
        b: ()(collect <: 3)         // insertion within clone args
        c: (collect <: 4)()         // insertion within clone source (will insert 4 twice)
        d: "hi" == (collect <: 5)   // insertion within binop
        e: !(collect <: 6)          // insertion within unary
        f: (collect <: 7).foo       // insertion within member access
        g: foo[(collect <: 8)]      // insertion within computed property access

        // todo: test insertions within list items
    `;

    const output = new Interpreter(testCode).interpretTest();

    // collector should contain [1, 2, 3, 4, 4, 5, 6, 7, 8]
	let items = extractItems(output.get('collect'));

    expect(items).toHaveLength(9);
    expect(items).toContain(1);
    expect(items).toContain(2);
    expect(items).toContain(3);
    expect(items).toContain(4);
    expect(items).toContain(5);
    expect(items).toContain(6);
    expect(items).toContain(7);
    expect(items).toContain(8);
});

test('duplicate insertions', () => {
    
    const testCode = `
        collect: collector
        foo: ()
        collect <: foo
        collect <: foo
    `;
    
    const output = new Interpreter(testCode).interpretTest();

    // collector should contain [1, 2, 3, 4, 4, 5, 6, 7, 8]
	let items = extractItems(output.get('collect'));

    expect(items).toHaveLength(2);
});
