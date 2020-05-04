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

// sends input template through a sequence of transformations.
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
	const NEXT_REGEX = /NEXT/;
	const VALUE_REGEX = /VALUE/;
	const ACCESS_REGEX = /(\w+)\[(\w+)\]/;
	const SPAWN_REGEX = /(\w+)\(\)/;
	const INSERTION_REGEX = /(\w+)\s*\<\:\s*(\w+)/;

	const makeMatcher = function (regex, onMatch) {
		return (str) => regex.test(str) ? onMatch(str.match(regex)) : str;
	}

	// if input is an object, we assume it does not need any more transformations
	const forwardObjects = function (transform) {
		return (input) => typeof input == 'object' ? input : transform(input);
	};

	const parse = (prop) => {
		const pipeline = [
			makeMatcher(NEXT_REGEX, () => ({ type: 'inbox_next' })),
			makeMatcher(VALUE_REGEX, () => ({ type: 'inbox_value' })),
			makeMatcher(ACCESS_REGEX, ([_, source, address]) => ({ type: 'access', source, address })),
			makeMatcher(SPAWN_REGEX, ([_, source]) => ({ type: 'spawn', source })),
			makeMatcher(INSERTION_REGEX, ([_, target, source]) => ({ target, source })),
			() => { throw Error(`unrecognized shorthand ${prop}`) },
		].map(transform => forwardObjects(transform));

		return compose(pipeline)(prop);
	};

	let template = { properties: {}, outbox: [] };
	for (const [addr, prop] of Object.entries(shorthand.properties)) {
		template.properties[addr] = parse(prop);
	}
	for (const item of shorthand.outbox) {
		template.outbox.push(parse(item));
	}
	return template;
}

export {
	transform,
};
