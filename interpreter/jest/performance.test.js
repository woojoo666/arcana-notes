// tracks how many updates are performed

import { Interpreter, NumberNode, Scope, NodeFactory } from '../interpreter.js';

const inputScope = Scope.fromObject({
    input: new NumberNode({value: 20}, null),
});

inputScope.get('input').update(); // initialize number node

class NodeFactoryPerf extends NodeFactory {
    updateCounter = 0;

    postTransform (node) {
        let oldUpdateFn = node.update.bind(node);
        node.update = () => { // TODO: maybe we should just override the evaluate() fn?
            this.updateCounter++;
            oldUpdateFn();
        }
        return node;
    }
}

test('performance test', () => {

    let nodeFactory = new NodeFactoryPerf();

    const testCode = 'foo: (bar: -1+x*2/y, x: 10, y: input), clone: foo(x: 5+y), barAlias: clone.bar';

    console.log(`--- initializing code: "${testCode}" with input value ${inputScope.get('input').value} ---`);
    const output = new Interpreter(testCode).interpretTest(inputScope, undefined, nodeFactory);

	expect(output.get('barAlias')).toEqual(1.5); // sanity check

    const initialPass = nodeFactory.updateCounter;
    console.log(`number of updates: ${initialPass}`);
    console.log('--- updating input node to value 10 ---');

    nodeFactory.updateCounter = 0; // reset counter
    inputScope.get('input').syntaxNode.value = 10;
    inputScope.get('input').update();
    
    expect(output.get('barAlias')).toEqual(2); // sanity check

    const updatePass = nodeFactory.updateCounter;
    console.log(`number of updates: ${updatePass}`);

    const stats = { testCode, initialPass, updatePass };
    expect(stats).toMatchSnapshot(); // snapshot performance stats so we can see when they change
});
