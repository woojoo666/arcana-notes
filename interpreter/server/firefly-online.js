// this module is the firefly interpreter extended with server capabilities

import fs from 'fs';
import path from 'path';
import { Interpreter, Node, Scope, ObjectNode, CollectorNode } from '../interpreter.js';
import { registerServerNode } from './server.js';

const starterPackSrc = fs.readFileSync(path.resolve(__dirname, '../starter-pack.owo'), 'utf8');

const webUtilsSrc = `
serve: ()
`;

class VirtualObject extends Node {
    
}

let starterPack = new Interpreter(starterPackSrc).interpretTest();
let webStarterPack = new Interpreter(webUtilsSrc).interpretTest(starterPack.scope);

let environment = webStarterPack.scope; // use the starter pack as the outer scope

function interpret (src) {
	const output = new Interpreter(src).interpretTest(environment, 'Indent');
	let numServers = output.listItems.size;
	if (numServers != 1) {
		throw Error(`please define exactly one server. Got ${numServers}`); // currently we only support one server
	} else {
		let firstServer = [...output.listItems][0];
		registerServerNode(firstServer);
	}
}

interpret(`
	serve
		index: "foo"
`)

export { interpret };
