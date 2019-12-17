/**
 * this is for transforming the AST syntax forms into primary forms, made up of: read, insert, combine
 */

import { Node } from './interpreter.js';
import { Globals, RESULT_KEY } from './globals.js';

class Transformer {

    processNode(syntaxNode) {

    }

    block({ statements }, parentScope) {
        let properties = {};
        let propertyList = {};
		for (const { key, value, type } of statements) {
			switch (type) {
				case 'property':
                    properties[key] = processNode(value, null);
                    propertyList[key] = 
					break;
				case 'insertion':
					throw Error('Unimplemented insertion handling'); // TODO
					break;
			}
        }
        let x = {
            behavior,
            scope,
            properties,
        };
        return new Node.Combine()
    }

    // a+b turns into +(a,b)->
    binop({ left, right, operator }) {
        let args = new Node.Combine({ left, right });
        let fnCall = new Node.Combine(Globals.getBinop(operator), args);
        return new Node.MemberAccess(fnCall, RESULT_KEY);
    }

    ternary(syntaxNode) {

    }
}
