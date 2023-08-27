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

// {
// 	function fun1(value, cb) {
// 		setTimeout(() => {
// 			cb(value);
// 		}, 500);
// 	}

// 	function fun2(value) {
// 		setTimeout(() => {
// 			console.log(value);
// 		}, 500);
// 	}

// 	function fun() {
// 		setTimeout(() => {
// 			fun1(10, fun2);
// 		}, 500);
// 	}

// 	fun(fun1);
// }



// function a(resolve) {
// 	setTimeout(() => {
// 		console.log('a')
// 		resolve()
// 	}, 4000)

// }

// function b(resolve) {
// 	setTimeout(() => {
// 		console.log('b')
// 		resolve()
// 	}, 2000)
// }

// function c(resolve) {
// 	setTimeout(() => {
// 		console.log('c')
// 		resolve()
// 	}, 1000)
// }

// function fn(f) {
// 	return new Promise((resolve, reject) => {
// 		f(resolve);
// 	})

// }

// function pLimit(fn, num) {
// 	let workQueue = [];
// 	let noWorkQueue = [];
// 	function fun(args) {
// 		// console.log(workQueue, noWorkQueue)
// 		if (workQueue.length < num) {
// 			workQueue.push(args);
// 			fn(args).then(() => {
// 				workQueue.shift();
// 				if(noWorkQueue.length > 0) {
// 					fun(noWorkQueue.shift())
// 				}
// 			});
// 		}else {
// 			noWorkQueue.push(args);
// 		}
// 	}
// 	return  (args) => {
		
// 		fun(args);
// 	}
// }

// // countLimit 是一个函数，执行fn，执行的并发度是 2，返回一个 Promise
// let countLimit = pLimit(fn, 2)
// countLimit(a) // 立即执行
// countLimit(b) // 立即执行
// countLimit(c) // 前两个函数执行完再执行


// const list = [
// 	{
// 	  name: '数据1',
// 	  parent: null,
// 	  id: 1,
// 	},
// 	{
// 		name: '数据5', 
// 		id: 6,
// 		parent: 2,
// 	},
// 	{
// 	  name: '数据2',
// 	  id: 2,
// 	  parent: 1,
// 	},
// 	{
// 	  name: '数据3',
// 	  parent: 2,
// 	  id: 3,
// 	},
// 	{
// 		name: '数据111',
// 		parent: 11,
// 		id: 12,
// 	},
// 	{
// 		name: '数据11',
// 		parent: null,
// 		id: 11,
// 	},
// 	{
// 	  name: '数据4',
// 	  parent: 3,
// 	  id: 4,
// 	},
//   ];

// const createTree = (list) => {
// 	const map = {};
// 	const tree = [];
// 	list.forEach(item => {
// 		const { id, parent } = item;
// 		// map[id] = item;
// 		if (!map[id]) map[id] = {};
// 		map[id] = map[id].children? {
// 			...item, children: map[id].children
// 		}: item;
// 		if (parent === null) {
// 			tree.push(map[id]);
// 		} else {
// 			if (!map[parent]) map[parent] = {};
// 			if (!map[parent].children) map[parent].children = [];
// 			map[parent].children.push(map[id])
// 		}
		
// 	})
// 	return tree;
// }

// createTree(list)

// /**
//  * 数组转树形结构
//  * @param {array} list 被转换的数组
//  * @param {number|string} root 根节点（最外层节点）
//  * @returns array
//  */
// function arrayToTreeV2(list, root) {
// 	const result = [] // 用于存放结果
// 	const map = {} // 用于存放 list 下的节点
  
// 	// 遍历 list
// 	for (const item of list) {
// 	  // 1. 获取节点的 id 和 父 id
// 	  const { id, parent } = item // ES6 解构赋值
  
// 	  // 2. 将节点存入 map
// 	  if (!map[id]) map[id] = {}
  
// 	  // 3. 根据 id，将节点与之前存入的子节点合并
// 	  map[id] = map[id].children
// 		? { ...item, children: map[id].children }
// 		: { ...item }
  
// 	  // 4. 如果是根节点，存入 result
// 	  if (parent === root) {
// 		result.push(map[id])
// 	  } else {
// 		// 5. 反之，存入父节点
// 		if (!map[parent]) map[parent] = {}
// 		if (!map[parent].children) map[parent].children = []
// 		map[parent].children.push(map[id])
// 	  }
// 	}
  
// 	// 将结果返回
// 	return result
//   }
// const data = arrayToTreeV2(list, null);

const tree = [
    {
        "name": "数据1",
        "parent": null,
        "id": 1,
        "children": [
            {
                "name": "数据2",
                "id": 2,
                "parent": 1,
                "children": [
                    {
                        "name": "数据5",
                        "id": 6,
                        "parent": 2
                    },
                    {
                        "name": "数据3",
                        "parent": 2,
                        "id": 3,
                        "children": [
                            {
                                "name": "数据4",
                                "parent": 3,
                                "id": 4
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        "name": "数据11",
        "parent": null,
        "id": 11,
        "children": [
            {
                "name": "数据111",
                "parent": 11,
                "id": 12
            }
        ]
    }
]

function treeToArray(list) {
	const dataList = [];
	function transformData(data, parentId) {
		data.forEach(item => {
			dataList.push({
				id: item.id,
				parent: parentId,
				name: item.name
			})
			if (item.children) {
				transformData(item.children, item.id)
			}
		})
		
	};
	transformData(list, null);
	return dataList;
}

treeToArray(tree)
