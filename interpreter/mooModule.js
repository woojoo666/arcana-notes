// This file is for wrapping moo.js in a ES6 module

let moo = null;

if (typeof module === 'object' && module.exports) {
	moo = require('moo');
} else { // if we aren't in Node.js, assume we are in the browser
	if (window.moo == undefined)
		throw Error('please include moo.js in your html');
	moo = window.moo;
}

export { moo };
