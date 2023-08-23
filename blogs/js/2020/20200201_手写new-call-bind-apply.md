---
title: 手写new, call, bind, apply
date: 2020-2-1
tags:
 - js
categories: 
 - js
---

# new
1.new 构造函数，主要做了什么？  
（1）创建一个新对象。  
（2） 新对象的__proto__指向构造函数的原型  
（3）绑定新对象的this。  
（4）返回一个对象  

```js
function myNew(fn, ...args) {
    // var obj = {};
    // obj.__proto__ = fn.prototype;
    var obj = Object.create(fn.prototype);
    var result = fn.apply(obj,args);
    return result instanceof Object? result: obj;
}

function fun(a,b) {
    this.a = a;
    var b = b;
}
console.log(new fun(10,1))
console.log(myNew(fun,10,1))
```
# call
1、函数调用call,做了什么？  
（1）获取函数和参数  
（2）函数调用参数；  
（3）返回结果  
```js
Function.prototype.myCall = function(obj) {
    obj.fn = this || window;
    var arg =  Array.prototype.slice.call(arguments,1);
    var result = obj.fn(...arg);
    delete obj.fn;
    return result
}
```
# apply
1、函数调用apply和call基本一样，只是传入的参数是数组
```js
Function.prototype.myApply = function(obj) {
    obj.fn = this || window;
    var arg = Array.prototype.slice.call(arguments,1).flat(1);
    var result = obj.fn(...arg);
    delete obj.fn;
    return result
}
```
# bind
1、函数调用bind做了什么？  
（1）改变this,绑定为obj；  
（2）返回一个函数；  
```js
 Function.prototype.myBind = function(obj) {
    var self = this;
    var args =  Array.prototype.slice.call(arguments,1);
    return function() {
        return self.apply(obj, args);    
    }
}
```