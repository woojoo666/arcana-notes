// this module is the firefly interpreter extended with server capabilities

import fs from 'fs';
import path from 'path';
import { Interpreter, Node, Scope, ObjectNode, CollectorNode } from '../interpreter.js';
import { registerServerNode } from './server.js';

const starterPackSrc = fs.readFileSync(path.resolve(__dirname, '../starter-pack.owo'), 'utf8');

const webUtilsSrc = `
serverCollector: collector
serve: (x: this.enable(serverCollector <: self), self: this)

numServers: serverCollector.length
firstServer: serverCollector[0]
`;

class VirtualObject extends Node {
    
}

let starterPack = new Interpreter(starterPackSrc).interpretTest();
let webStarterPack = new Interpreter(webUtilsSrc).interpretTest(starterPack.scope);

let environment = webStarterPack.scope; // use the starter pack as the outer scope

webStarterPack.get('serverCollector');

function bootstrapListener(node, listener) {
	let oldFn = node.notifyListeners.bind(node);
	node.notifyListeners = () => {
		listener(node);
		oldFn();
	}
}

function interpret (src) {
	new Interpreter(src).interpretTest(environment, 'Indent');
	let numServers = webStarterPack.get('numServers');
	if (numServers != 1) {
		throw Error(`please define exactly one server. Got ${numServers}`); // currently we only support one server
	} else {
		registerServerNode(webStarterPack.get('firstServer'));
	}
}

interpret(`
	client: serve
		enable: ()

		index: "foo"
`)

console.log(webStarterPack.get('firstServer').syntaxNode);

export { interpret };
