// current the convenient matchAll function is not supported by IE, Edge, Opera, or Node.js
// Track it's progress
//   MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/matchAll
//   Spec Proposal: https://github.com/tc39/proposal-string-matchall

// For now I am using the library function from [this SO answer](https://stackoverflow.com/a/50470820/1852456)

const matchAll = (text, pattern) => ({
	[Symbol.iterator]: function * () {
		const clone = new RegExp(pattern.source, pattern.flags);
		let match = null;
		do {
			match = clone.exec(text);
			if (match) {
				yield match;
			}
		} while (match);
	}
});

// Utility function for retrieving commonJS or browser objects from ES6 modules
function importCommonJS (name) {
	if (typeof module === 'object' && module.exports) {
		return require(name);
	} else { // if we aren't in Node.js, assume we are in the browser
		if (!window[name])
			throw Error('please include the script for ' + name + ' in your html');
		return window[name];
	}
}

export { matchAll, importCommonJS };
