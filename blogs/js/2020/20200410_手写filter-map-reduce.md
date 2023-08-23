---
title: 手写filter,map,reduce
date: 2020-2-1
tags:
 - js
categories: 
 - js
---

# filter
```js
var data = [2, 4, 1, 5, 6];
console.log('原filter')
var result = data.filter((item,id,arr) => {
    console.log(item, id, arr);
    return item >= 4;
})
console.log(result)
console.log('手写filter')
Array.prototype.myFilter = function (fn) {

    if (Object.prototype.toString.call(fn) != '[object Function]') {
        throw 'params not function'
    }
    var content = this;
    var result = [];
    for (let i = 0; i < content.length; i++) {
        if (fn(content[i], i, content)) {
            result.push(content[i]);
        }
    };
    return result

}
var res = data.myFilter(function (item, id, arr) {
    console.log(item, id, arr)
    return item >= 4;
})
console.log(res)
```
![结果](/img/2020/filter.jpg);

# map
```js
var data = [2, 4, 1, 5, 6];
console.log('原map')
var result = data.map((item,id,arr) => {
    console.log(item, id, arr);
    return item + 4;
})
console.log(result);
console.log(data)
console.log('手写map')
Array.prototype.myMap = function (fn) {

    if (Object.prototype.toString.call(fn) != '[object Function]') {
        throw 'params not function'
    }
    var content = this;
    var result = [];
    for (let i = 0; i < content.length; i++) {
        result.push(fn(content[i], i, content));  
    };
    return result

}
var res = data.myMap(function (item, id, arr) {
    console.log(item, id, arr)
    return item + 4;
})
console.log(res)
console.log(data)
```
![结果](/img/2020/map.jpg);

# reduce
```js
var data = [2, 4, 1, 5, 6];
console.log('原reduce')
var result = data.reduce((lastItem, currentItem,id,arr) => {
    console.log(lastItem, currentItem, id, arr);
    return lastItem+currentItem;
})
console.log(result);
console.log(data)
console.log('手写reduce')
Array.prototype.myReduce = function (fn, lastItem) {

    if (Object.prototype.toString.call(fn) != '[object Function]') {
        throw 'params not function'
    }
    var content = this;
    var index;
    var sum;
    // 判断是否不止一个参数；无第二个参数用数组第一个数做初始值。
    index = arguments.length == 1? 1: 0; 
    sum = arguments.length == 1? content[0]: lastItem;
    for (let i = index; i < content.length; i++) {
        sum = fn(sum, content[i], i, content);  
    };
    return sum

}
var res = data.myReduce(function (lastItem, currentItem, id, arr) {
    console.log(lastItem, currentItem, id, arr);
    return lastItem+currentItem;
})
console.log(res)
console.log(data)
```
![结果](/img/2020/reduce.jpg);
