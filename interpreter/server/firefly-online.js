// this module is the firefly interpreter extended with server capabilities

import { Interpreter, Node, Scope } from '../interpreter.js';

// whenever this is cloned, it 
class ServerNode extends Node {
    foo() { return 10; }
}
