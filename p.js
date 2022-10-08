// {
// 	let handler = {
// 		get: function (target, name) {
// 			console.log("get:", target, name);
// 			if (target.hasOwnProperty(name)) {
// 				return target[name];
// 			} else {
// 				console.warn("没有该属性！");
// 				return undefined;
// 			}
// 		},
// 		set: function (target, name, receiver) {
// 			console.log("set:", target, name, receiver);
// 			target[name] = receiver;
// 			return;
// 		},
// 		getPrototypeOf(target) {
// 			console.log("getPrototypeOf:", target);
// 			return target;
// 		},
// 		defineProperty: function (target, prop, descriptor) {
// 			console.log("defineProperty: ", target, prop, descriptor);
// 			return true;
// 		},
// 		deleteProperty: function (target, name) {
// 			console.log("deleteProperty: ", target, name);
// 			if (target.hasOwnProperty(name)) {
// 				delete target[name];
// 				return true;
// 			} else {
// 				return false;
// 			}
// 		},
// 		getOwnPropertyDescriptor: function (target, name) {
// 			console.log("getOwnPropertyDescriptor: ", target, name);
// 			return {
// 				configurable: true,
// 				enumerable: true,
// 				value: 10,
// 				writable: true,
// 			};
// 		},
// 		has: function (target, name) {
// 			console.log("has: ", target, name);
// 			return true;
// 		},
// 		isExtensible: function (target) {
// 			console.log("isExtensible:", target);
// 			return true; // 也可以 return 1; 等表示为 true 的值
// 		},
// 		preventExtensions: function (target) {
// 			console.log("preventExtensions：", target);
// 			Object.preventExtensions(target);
// 			return true;
// 		},
// 		setPrototypeOf: function (target, proto) {
// 			console.log("setPrototypeOf:", target, proto);
// 			return true;
// 		},
// 		apply: function (target, thisArg, argumentsList) {
// 			console.log(`apply:`, target, thisArg, argumentsList);
// 			return target(argumentsList[0], argumentsList[1]) * 10;
// 		},
// 		ownKeys: function (target) {
// 			console.log("ownKeys:", target);
// 			return ["a", "b", "c"];
// 		},
// 	};
// 	var p = new Proxy(
// 		{
// 			a: 2,
// 		},
// 		handler
// 	);
// 	console.log(p.a); // {a: 2} 'a' 2
// 	console.log(p.b); // {a: 2} 'b' 没有该属性！ undefined
// 	p.b = 3;

// 	console.log(Object.getPrototypeOf(p), p);

// 	var desc = {
// 		configurable: true,
// 		enumerable: true,
// 		value: 10,
// 		writable: true,
// 	};
// 	Object.defineProperty(p, "a", desc);

// 	console.log(delete p.b);
// 	console.log(p);

// 	console.log(Object.getOwnPropertyDescriptor(p, "a"));

// 	console.log("a" in p);

// 	Object.isExtensible(p);

// 	// console.log(Object.preventExtensions(p));

// 	Object.setPrototypeOf(p, {
// 		c: 1,
// 	});

// 	Object.getOwnPropertyNames(p);
// 	Object.getOwnPropertySymbols(p);
// 	Object.keys(p);
// 	let { proxy, revoke } = Proxy.revocable(
// 		{
// 			a: 2,
// 			b: 3,
// 		},
// 		handler
// 	);
// 	proxy.foo = 123;
// 	console.log("proxy", proxy);

// 	revoke();
// 	console.log(proxy);
// }
// // p1.call(obj, 2, 5);

// {
// 	var handler = {
// 		apply: function (target, thisArg, argumentsList) {
// 			console.log(`apply:`, target, thisArg, argumentsList);
// 			return target(argumentsList[0], argumentsList[1]) * 10;
// 		},
// 		construct: function (target, argumentsList, newTarget) {
// 			console.log("construct: ", target, argumentsList, newTarget);
// 			return { value: argumentsList[0] * 10 };
// 		},
// 	};
// 	function fun(a, b) {
// 		return a + b;
// 	}
// 	const obj = {
// 		a: 3,
// 		b: 1,
// 	};
// 	var proxy = new Proxy(fun, handler);
// 	console.log("proxy", proxy(1, 2)); // apply: [Function: fun] undefined [ 1, 2 ] proxy 30
// 	console.log("proxy.call", proxy.call(obj, 5, 6)); // apply: [Function: fun] { a: 3, b: 1 } [ 5, 6 ] proxy.call 110
// 	console.log("proxy,apply", proxy.apply(obj, [7, 8])); // apply: [Function: fun] { a: 3, b: 1 } [ 7, 8 ] proxy,apply 150

// 	new proxy(obj, 3, 1);
// }

{
	function fun1(value, cb) {
		setTimeout(() => {
			cb(value);
		}, 500);
	}

	function fun2(value) {
		setTimeout(() => {
			console.log(value);
		}, 500);
	}

	function fun() {
		setTimeout(() => {
			fun1(10, fun2);
		}, 500);
	}

	fun(fun1);
}
