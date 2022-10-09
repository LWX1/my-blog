---
title: React 事件
date: 2021-02-02
isShowComments: false
tags:
    - react
categories:
    - react
---

## 介绍

-   react 事件是合成机制事件，具有高性能得优点，且将事件标准化一致，从而达到跨平台运用。
-   合成事件是浏览器原生事件和跨浏览器包装器得封装，除了兼容所有浏览器外，它还存在浏览器原生得事件接口，包括<font color="orange">stopPropagation</font>阻止事件捕获和冒泡，<font color="orange">preventDefault</font>阻止事件默认行为

## 如何绑定

### 问题

```
class App extends React.Component {
    handleClick() {
        console.log(this) // undefined
    }
    render() {
        return <div onClick={this.handleClick}>test</div>
    }
}
```

-   上面得例子说明 this 有问题，获取不到 class 中的 this，即获取不到 state 值。

### 绑定方式

-   render 中使用 bind
-   render 中使用箭头函数
-   constructor 中使用 bind
-   定义函数时使用箭头函数

#### render 中使用 bind

```
class App extends React.Component {
  handleClick() {
    console.log('this：', this);
  }
  render() {
    return (
      <div onClick={this.handleClick.bind(this)}>test</div>
    )
  }
}
```

-   这种方式是通过 bind 来改变函数的指向，使其指向 class，该方式每次组件渲染都要重新进行 bind 绑定，影响性能。

### render 中使用箭头函数

```
class App extends React.Component {
  handleClick() {
    console.log('this：', this);
  }
  render() {
    return (
      <div onClick={(e) => {this.handleClick(e)}}>test</div>
    )
  }
}
```

-   箭头函数中的 this 即外层的 this，所以 this 指向 class；但每次渲染时都会生成新的方法，进而影响性能

### constructor 中 bind

```
class App extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() {
    console.log('this：', this);
  }
  render() {
    return (
      <div onClick={(e) => {this.handleClick(e)}}>test</div>
    )
  }
}
```

-   在 constructor 中预先通过 bind 改变 this 的指向，可以避免重复绑定，但是方法过多，比较繁琐。

### 定义时使用箭头函数

```
class App extends React.Component {
  handleClick = () => {
    console.log('this：', this);
  }
  render() {
    return (
      <div onClick={(e) => {this.handleClick(e)}}>test</div>
    )
  }
}
```

-   避免重复绑定，实现简单，却不繁琐，为最优方式。

## 合成事件

-   合成事件是 React 模拟原生 DOM 事件的一个跨浏览器包装器，根据 W3C 规范定义合成事件，兼容所有的浏览器。
-   可以通过 e.nativeEvent 获取原生事件

```
const handleClick = (e) => console.log(e.nativeEvent);
const button = <button onClick={handleClick}>按钮</button>;
```

-   React17 之前，合成事件统一挂载到 document 上，17 后挂载在 root 上。
-   React 的事件触发发生在 DOM 的冒泡阶段，<font color="orange">dispatchEvent</font> 会对事件进行分发，根据存储的事件类型<font color="orange">type</font> 和标识<font color="orange">key</font>找到相关触发事件的组件元素，再遍历元素的父元素，构造合成事件，存储在队列中。

### 执行顺序

```
function App() {
	const refParent = useRef(null);
	const refChild = useRef(null);
	useEffect(() => {
		console.log("React useEffect");
		refParent.current?.addEventListener("click", () => {
			console.log("原生事件：父元素 DOM 事件监听！");
		});
		refChild.current?.addEventListener("click", () => {
			console.log("原生事件：子元素 DOM 事件监听！");
		});
		document.getElementById("root").addEventListener("click", (e) => {
			console.log("原生事件：root DOM 事件监听！");
		});
	}, []);
	const parentClick = () => {
		console.log("react父元素点击");
	};
	const childClick = () => {
		console.log("react子元素点击");
	};
	return (
		<div className="app">
			<div
				ref={refParent}
				onClick={parentClick}
			>
				<div
					ref={refChild}
					onClick={childClick}
				>
					分析事件执行
				</div>
			</div>
		</div>
	);
}
```

-   点击触发事件执行，结果如下

```
React useEffect
原生事件：子元素 DOM 事件监听！
原生事件：父元素 DOM 事件监听！
react子元素点击
react父元素点击
原生事件：root DOM 事件监听！
```

-   阻止事件冒泡

```
refChild.current?.addEventListener("click", (e) => {
    e.stopPropagation();
    console.log("原生事件：子元素 DOM 事件监听！");
});
```

-   点击触发事件执行，结果如下

```
React useEffect
原生事件：子元素 DOM 事件监听！
```

-   阻止最外层事件冒泡

```
const childClick = (e) => {
    e.nativeEvent.stopImmediatePropagation();
    console.log("react子元素点击");
};
```

-   点击触发事件执行，结果如下

```
React useEffect
原生事件：子元素 DOM 事件监听！
原生事件：父元素 DOM 事件监听！
react子元素点击
react父元素点击
```

-   总结

1. React 中所有的事件都挂载在 ROOT 中；
2. 当真实 DOM 元素触发事件，会冒泡到 ROOT 上，再处理 React 事件
3. 先处理原生事件，再处理 React 事件
4. 最后执行 ROOT 上挂载的事件
5. stopPropagation 阻止事件冒泡
6. stopImmediatePropagation 阻止最外层事件触发
