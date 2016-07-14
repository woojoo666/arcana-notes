/*
 *	Structure:
 *
 *	values = {
 *		key1: "hello"
 *		key2: {
 *			subkey1: {...},
 *		},
 *		mArray: [
 *			{...},
 *			{...},
 *			{...},
 *		],
 *	};
 *
 *	bindings = {
 *		key1: [evals to trigger...]
 *		key2: [myeval, anothereval]
 *		key2.subkey1: [anothereval]
 *		mArray: [myarrayeval, mapFn, reduceFn, aliasFn],
 *		mArray.0: [mapSubFn0, reduceSubFn],
 *		mArray.1: [mapSubFn1, reduceSubFn],
 *		mArray.2: [mapSubFn2, reduceSubFn],
 *	};
 *  
 *	aliases = {
 *		myalias: aliasSrc,
 *	};
 *  
 */

class FloModule {

	constructor () {
		this.bindings = {};
		this.values = {};
		this.aliases = {};
	}

	getVal (path) {
		var obj = this.values;
		if (!path) return obj;

		var keys = (''+path).split('.');
		while (keys.length > 0) {
			var head = keys.shift();
			obj = obj[head];
		}
		return obj;
	}

	getListeners (path) {
		return this.bindings[path] || (this.bindings[path] = []);
	}

	aliasbind (dest, src) {
		this.aliases[dest] = src;
		this.bind(dest, [src], x => x);
	}

	bind (dest, triggers, fn) {
		var evaluator = () => {
			var triggerVals = triggers.map( trigger => this.getVal(trigger));
			var newVal = fn.apply(this, triggerVals);
			this.setVal(dest, newVal);
		};
		for (var i = 0; i < triggers.length; i++) {
			var parts = triggers[i].split('.');
			var head = parts.shift();
			var tail = parts.join('.');
			var trigger = (this.aliases[head] || head) + tail;
			this.getListeners(trigger).push(evaluator);
		}
		evaluator();
	}

	separateLast (path) {
		var keys = path.split('.');
		var last = keys.pop();
		return {parentPath: keys.join('.'), key: last};
	}

	setVal (path, value) {
		var split = this.separateLast(path);
		var parent = this.getVal(split.parentPath);
		var prev = parent[split.key];
		parent[split.key] = value;
		if (prev === undefined) this.trigger(split.parentPath); // key added, trigger collection binding
		this.trigger(path); // trigger regular binding
	}

	deleteProp (path) {
		var split = this.separateLast(path);
		var parent = this.getVal(split.parentPath);
		delete parent[split.key];
		this.trigger(path); // trigger regular binding
		this.trigger(split.parentPath); // key removed, trigger collection binding
	}

	trigger (path) {
		var listeners = this.getListeners(path);
		for (var i = 0; i < listeners.length; i++) {
			listeners[i]();
		}
	}

	/******************************** Included Functions *******************************/

	// these functions are not part of FloModule operation, but are useful to have

	mapbind (dest, src, fn) {
		this.bind('devnull', [src], ar => {
			this.setVal(dest,[]);
			// do we need to remove the old bindings when rebinding?
			ar.forEach((_, i) => this.bind(dest+'.'+i, [src+'.'+i], fn));
		});
	}

	reducebind (dest, src, fn, start) {
		this.bind('devnull', [src], ar => {
			var triggers = ar.map((_,i) => src+'.'+i);
			// do we need to remove the old bindings when rebinding?
			this.bind(dest, triggers, () => ar.reduce(fn, start));
		});
	}

	filterbind (dest, src, fn) {
		this.reducebind(dest, src, (acc, x) => fn(x) ? acc.concat(x) : acc, []);
	}
}
