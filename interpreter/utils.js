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

// synchronous XMLHttpRequest + eval() is the only way I can find to load files synchronously
// to explain why we need this, see [this SO question](https://stackoverflow.com/q/56069232/1852456)
function loadScriptSync(file) {
	var req = new XMLHttpRequest();
	req.open('GET', file, false);
	req.send(null);
	eval(req.responseText);
}

// Utility function for retrieving commonJS or browser objects from ES6 modules
function importCommonJS (name, filename) {
	filename = filename || name + '.js';
	if (typeof module === 'object' && module.exports) {
		return require(name);
	} else { // if we aren't in Node.js, assume we are in the browser
		loadScriptSync.call(window, filename);
		return window[name];
	}
}

export { matchAll, importCommonJS };
