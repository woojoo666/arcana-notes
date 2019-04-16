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

export { matchAll };
