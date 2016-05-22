/*
 *	Structure:
 *
 *	values = {
 *			key1: "hello"
 *			key2: {
 *				subkey1: {...},
 *			},
 *			mArray: [
 *				{...},
 *				{...},
 *				{...},
 *			],
 *		},
 *	};
 *
 *	bindings = {
 *			key1: [eval1]
 *			key2: [eval2]
 *			key2.subkey1: [eval2]
 *			mArray: [arrayeval1],
 *			mArray.0: [array0eval],
 *			mArray.1: [array1eval],
 *			mArray.2: [array2eval],
 *		},
 *	};
 */

function FloModule () {}

FloModule.prototype = {
	bindings: {},
	values: {},
	get: function (path) {
		var obj = this.values;
		if (!path) return obj;

		var keys = path.split('.');
		while (keys.length > 0) {
			var head = keys.shift();
			obj = obj[head];
		}
		return obj;
	},
	getListeners: function (path) {
		return this.bindings[path] || (this.bindings[path] = []);
	},
	bind: function (dest, triggers, fn) {
		var self = this;
		function evaluator () {
			var triggerVals = triggers.map(function(trigger){ return self.get(trigger); });
			var newVal = fn.apply(self, triggerVals);
			self.set(dest, newVal);
		}
		for (var i = 0; i < triggers.length; i++) {
			self.getListeners(triggers[i]).push(evaluator);
		}
		evaluator();
	},
	separateLast: function (path) {
		var keys = path.split('.');
		var last = keys.pop();
		return {parentPath: keys.join('.'), key: last};
	},
	set: function (path, value) {
		var split = this.separateLast(path);
		var parent = this.get(split.parentPath);
		var prev = parent[split.key];
		parent[split.key] = value;
		if (prev === undefined) this.trigger(split.parentPath); // key added, trigger collection binding
		this.trigger(path); // trigger regular binding
	},
	delete: function (path) {
		var split = this.separateLast(path);
		var parent = this.get(split.parentPath);
		delete parent[split.key];
		this.trigger(path); // trigger regular binding
		this.trigger(split.parentPath); // key removed, trigger collection binding
	},
	trigger: function (path) {
		var listeners = this.getListeners(path);
		for (var i = 0; i < listeners.length; i++) {
			listeners[i]();
		}
	},
};
