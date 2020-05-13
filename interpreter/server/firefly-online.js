// this module is the firefly interpreter extended with server capabilities

import fs from 'fs';
import path from 'path';
import { Interpreter, Node, Scope, ObjectNode, CollectorNode } from '../interpreter.js';
import { registerServerNode } from './server.js';

const starterPackSrc = fs.readFileSync(path.resolve(__dirname, '../starter-pack.owo'), 'utf8');

const webUtilsSrc = `
serverCollector: collector
Server: (serverCollector <: this)

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

bootstrapListener(webStarterPack.getNode('numServers'), (node) => {
	if (node.value > 1)
		console.error('only one server allowed!'); // currently we only support one server
});
bootstrapListener(webStarterPack.getNode('firstServer'), (node) => {
	// registerServerNode(node);
});

function interpret (src) {
	new Interpreter(src).interpretTest(environment, 'Indent');
}

interpret(`
	myServer: Server
		port: undefined
		enable: ()
		client:
			index: "foo"
`)

export { interpret };
