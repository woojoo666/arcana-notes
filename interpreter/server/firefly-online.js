// this module is the firefly interpreter extended with server capabilities

import { Interpreter, Node, Scope } from '../interpreter.js';
import { registerServerNode } from './server.js';

// whenever this is cloned, it 
class ServerNode extends Node {
    constructor(syntaxNode, parent) {
        super(syntaxNode, parent);
        if (syntaxNode == null) {
            return; // base client node has no route, no initialization. Merely a template for cloning
        }
        const extractProperty = name => syntaxNode.statements.find(stmt => stmt.key == name).value
        // TODO: allow server nodes to specify a port, so we can declare multiple server nodes.
        //       right now this is difficult because the websocket port is hardcoded in the client html+js.
        this.clientNode = extractProperty('client');
        registerServerNode(this);
    }
    clone(syntaxNode) {
        new ServerNode()
        this.scope = 
    }
    getClient () {
        return this.clientNode;
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
