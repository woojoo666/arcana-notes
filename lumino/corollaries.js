/**
 * corollaries (secondary forms built on top of the axioms):
	* parametized templates
	* equality
	* object keys
	* scoping
	* cloning
	* conditionals
	* sets / collectors
	* set ordering
 */

import { UNDEFINED, Firefly } from './lumino';

// note: each transformation is optional.
function transform (template) {
	let pipeline = compose([
		transformShorthand,
	]);
	return pipeline(template);
}

// creates a pipeline from an array of functions
function compose(fns) {
	return function (input) {
		let result = input;
		for (const fn of fns) {
			result = fn(result);
		}
		return result;
	};
}

// see corollaries.test.js for an example of what shorthand looks like
function transformShorthand (shorthand) {
	const ACCESS_REGEX = /(\w+)\[(\w+)\]/;
	const SPAWN_REGEX = /(\w+)\(\)/;
	const INSERTION_REGEX = /(\w+)\s*\<\:\s*(\w+)/;

	const parseProp = (prop) => {
		if (typeof prop == 'object')
			return prop; // we assume all object props are already transformed

		if (prop == 'NEXT')
			return { type: 'inbox_next' };
		if (prop == 'VALUE')
			return { type: 'inbox_value' };
	
		if (ACCESS_REGEX.test(prop)) {
			const [_, source, address] = prop.match(ACCESS_REGEX);
			return { type: 'access', source, address };
		}
		if (SPAWN_REGEX.test(prop)) {
			const [_, source] = prop.match(SPAWN_REGEX);
			return { type: 'spawn', source };
		}
		throw Error(`unrecognized shorthand ${item}`);
	};

	const parseItem = (item) => {
		if (typeof item == 'object')
			return item; // we assume all object items are already transformed

		if (INSERTION_REGEX.test(item)) {
			const [_, target, source] = item.match(INSERTION_REGEX);
			return { target, source };
		}
		throw Error(`unrecognized shorthand ${item}`);
	};

	let template = { properties: {}, outbox: [] };
	for (const [addr, prop] of Object.entries(shorthand.properties)) {
		template.properties[addr] = parseProp(prop);
	}
	for (const item of shorthand.outbox) {
		template.outbox.push(parseItem(item));
	}
	return template;
}

export {
	transform,
};
