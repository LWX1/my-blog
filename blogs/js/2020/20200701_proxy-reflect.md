---
title: proxy和reflect
date: 2020-7-1
tags:
    - es6
categories:
    - es6
---

## Proxy

proxy 是对目标对象的一个代理，任何对目标对象的操作都要经过代理，通过代理可以对外界操作进行过滤和改写。  
<font color="orange">proxy</font>是构造函数，有两个参数<font color="orange">target</font>和<font color="orange">handler</font>  
<font color="orange">target</font> 是用 Proxy 包装的目标对象，可以为任何类型的对象，如原生数组、函数或者另一个代理对象  
<font color="orange">handler</font> 是一个对象，其属性是执行一个操作是定义的行为函数

-   handler 代理方法

1. 对象篇

```js
let handler = {
    // 获取时触发 
    get: function(target, name) {
        console.log('get:', target, name);
        if(target.hasOwnProperty(name)) {
            return target[name]
        }else {
            console.warn("没有该属性！")
            return undefined
        }
    },
    // 赋值时触发 
    set: function(target, name, receiver) {
        console.log('set:', target, name, receiver)
        target[name] = receiver;
        return
    },
    // 获取原型触发 
    getPrototypeOf(target) {
        console.log('getPrototypeOf:', target)
        return target
    },
    // 监控Object.defineProperty 
    defineProperty: function(target, prop, descriptor) {
        console.log('defineProperty: ', target, prop, descriptor);
        return true;
    },
    // 监听属性删除 
    deleteProperty: function (target, name) {
		console.log("deleteProperty: ", target, name);
		if (target.hasOwnProperty(name)) {
			delete target[name];
			return true;
		} else {
			return false;
		}
	},
    // 监听Object.getOwnPropertyDescriptor 获取属性配置 
    getOwnPropertyDescriptor: function (target, name) {
		console.log("getOwnPropertyDescriptor: ", target, name);
		return {
			configurable: true,
			enumerable: true,
			value: 10,
			writable: true,
		};
	},
    // 监听in 
    has: function (target, name) {
		console.log("has: ", target, name);
		return true;
	},
    /** 
        监听Object.isExtensible 是否可扩展
        Object.preventExtensions(p)、Object.seal(p)或Object.freeze(p)阻止扩展
        Object.preventExtensions(p)无法添加新属性
        Object.seal(p) 所有属性不可配置
        Object.freeze(p) 不可扩展，不可配置，也不可改写，变成一个仅可以枚举的只读常量
    */
    isExtensible: function (target) {
		console.log("isExtensible:", target);
		return true; // 也可以 return 1; 等表示为 true 的值
	},
    // 监听Object.preventExtensions 
    preventExtensions: function (target) {
		console.log("preventExtensions：", target);
		Object.preventExtensions(target);
		return true;
	},
    // 监听Object.setPrototypeOf 原型链 
    setPrototypeOf: function (target, proto) {
		console.log("setPrototypeOf:", target, proto);
		return true;
	},
    // 监听Object.getOwnPropertyNames、Object.getOwnPropertySymbols、Object.keys 
    ownKeys: function (target) {
        console.log("ownKeys:", target);
        return ["a", "b", "c"];
    },
}
var p = new Proxy({
    a: 2
}, handler);
console.log(p.a) // get: {a: 2} 'a' 2
console.log(p.b) // get: {a: 2} 'b' 没有该属性！ undefined

p.b = 20; // set: { a: 2 } b 3;

// 获取原型 
Object.getPrototypeOf(p) // getPrototypeOf: { a: 2, b: 3 }

var desc = {
    configurable: true, // 是否可以删除或是修改属性特性 默认为false 不能被删除或重新定义属性
    enumerable: true, // 是否可以被枚举 默认为false 不能被枚举，true可以被枚举
    writable: true, // 是否可以被重写 默认为false 不能被重写，true可以被重写
    value: 10, // 设置的默认值
    get:() => 2, // 获取值
    set:() => 2, // 设置值
};
Object.defineProperty(p, "a", desc); defineProperty:  { a: 2, b: 3 } a { value: 10, enumerable: true, configurable: true }

console.log(delete p.b); // true

console.log(p); // { a: 2 }

console.log(Object.getOwnPropertyDescriptor(p, "a")); // getOwnPropertyDescriptor:  { a: 2 } a { value: 10, writable: true, enumerable: true, configurable: true }

console.log("a" in p); // has:  { a: 2 } a true

Object.isExtensible(p); // isExtensible: { a: 2 }

console.log(Object.preventExtensions(p)); // preventExtensions： { a: 2 } { a: 2 }

Object.setPrototypeOf(p, {
	c: 1,
}); // setPrototypeOf: { a: 2 } { c: 1 }

Object.getOwnPropertyNames(p); // ownKeys: { a: 2 }

Object.getOwnPropertySymbols(p); // ownKeys: { a: 2 }

Object.keys(p); // ownKeys: { a: 2 } getOwnPropertyDescriptor:  { a: 2 } a  getOwnPropertyDescriptor:  { a: 2 } b getOwnPropertyDescriptor:  { a: 2 } c
```

2. 函数篇

```js
	var handler = {
        // 监听函数调用，call、apply、bind 
		apply: function (target, thisArg, argumentsList) {
			console.log(`apply:`, target, thisArg, argumentsList);
			return target(argumentsList[0], argumentsList[1]) * 10;
		},

        construct: function (target, argumentsList, newTarget) {
			console.log("construct: ", target, argumentsList, newTarget);
			return { value: argumentsList[0] * 10 };
		},
	};
	function fun(a, b) {
		return a + b;
	}
	const obj = {
		a: 3,
		b: 1,
	};
	var proxy = new Proxy(fun, handler);
	console.log("proxy", proxy(1, 2)); // apply: [Function: fun] undefined [ 1, 2 ] proxy 30
	console.log("proxy.call", proxy.call(obj, 5, 6)); // apply: [Function: fun] { a: 3, b: 1 } [ 5, 6 ] proxy.call 110
	console.log("proxy,apply", proxy.apply(obj, [7, 8])); // apply: [Function: fun] { a: 3, b: 1 } [ 7, 8 ] proxy,apply 150

    new proxy(obj, 3, 1); // [Function: fun] [ { a: 3, b: 1 }, 3, 1 ] [Function: fun]
```

3. 撤销代理

```js
let { proxy, revoke } = Proxy.revocable(
    {
        a: 2,
        b: 3,
    },
    handler
);
proxy.foo = 123;
console.log("proxy", proxy);
// 撤销代理
revoke();
console.log(proxy); // 报错
```

## Reflect

Reflect 是 es6 内置的对象，提供拦截 js 操作的方法，它的所有方法都为静态方法。

### 为什么需要Reflect对象

reflect就是一种语法的变体，里面的语法都可以在原始语法中找到替代；那为啥需要Reflect，存在必合理，假如reflect仅仅只是换种语法，存在意义其实并不大。个人觉得，reflect新语法的出现，其实是为了元编程埋下种子；目前Object中挂载很多方法了，后续可能还会出现一些更便捷的方法，一些新的元编程的方法，不可能继续挂载到Object中，这样太杂了，为了日后元编程的方法更好管理，就出了reflect来管理。且Reflect对象的方法与Proxy对象的方法相同。

### 方法对应
1. Reflect.apply(target, thisArg, argumentsList) ==> Function.prototype.apply()
2. Reflect.construct(target, argumentsList, [newTarget]) ==> new target(...args)
3. Reflect.defineProperty(target, propertyKey, attributes) ==> Object.defineProperty()
4. Reflect.deleteProperty(target, propertyKey) ==> delete target[name]
5. Reflect.get(target, propertyKey[, receiver]) ==> target[name]
6. Reflect.getOwnPropertyDescriptor(target, propertyKey) ==> Object.getOwnPropertyDescriptor()
7. Reflect.getPrototypeOf(target) ==> Object.getPrototypeOf()
8. Reflect.has(target, propertyKey) ==> in 运算符
9. Reflect.isExtensible(target) ==> Object.isExtensible()
10. Reflect.ownKeys(target) ==> Object.keys()
11. Reflect.preventExtensions(target) ==> Object.preventExtensions()
12. Reflect.set(target, propertyKey, value[, receiver]) ==> target[name]=value
13. Reflect.setPrototypeOf(target, prototype) ==> Object.setPrototypeOf() 
