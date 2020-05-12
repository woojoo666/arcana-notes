// this module is the firefly interpreter extended with server capabilities

import { Interpreter, Node, Scope } from '../interpreter.js';
import { registerServerNode } from './server.js';

// whenever this is cloned, it 
class ServerNode extends Node {
    constructor(syntaxNode, parent) {
        super(syntaxNode, parent);
        if (syntaxNode == null) {
            return; // base server node has no route, no initialization. Merely a template for cloning
        }
        // we expect a string literal for the route
        let route = syntaxNode.statements.filter(stmt => stmt.key == 'route').map(stmt => stmt.value.value)[0];
        registerServerNode(route, this);
    }
    clone() {
        // TODO
    }
    resolveReferences(scope) {
        // send scope to client
    }
}

class VirtualObject extends Node {
    
}

let baseServerNode = new ServerNode(null, parent);

webScope = new Scope();
Scope.set('Server', ServerNode)
