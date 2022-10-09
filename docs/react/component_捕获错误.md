---
title: React 捕获错误
date: 2021-02-03
isShowComments: false
tags:
    - react
categories:
    - react
---

## 错误边界

-   React 开发是由多个组件构建而成的 UI，部分 UI 错误不应该导致整个程序奔溃，所以 React16 引入了新的概念——错误边界

-   错误边界在渲染期间、生命周期方法和整个组件树的构造函数中捕获错误

-   捕获错误的两个重要生命周期<font color="orange"> static getDerivedStateFromError</font>和<font color="orange"> componentDidCatch </font>

```
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 你同样可以将错误日志上报给服务器
  }

  render() {
    if (this.state.hasError) {
      // 你可以自定义降级后的 UI 并渲染
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

-   使用

```
root.render(
	<>
		<div>222</div>
		<ErrorBoundary>
			<App />
		</ErrorBoundary>
	</>
);

// App组件
useEffect(() => {
		console.log(window.data.name)
}, []);

// 页面
222
Something went wrong.
```

-   又上可知，App 组件报错，被错误组件捕获，错误组件直接替代 App 组件，其他组件模块正常显示。

### 注意

错误边界\* 无法\*捕获一下场景中的错误：

-   事件处理

-   异步代码（setTimeout/setInterval）

-   服务端渲染

-   它自身的错误（并非它的子组件）

### 特殊处理

-   当一些错误边界组件无法捕获到的错误，我们还可以通过监听 onerror 事件来捕获

```
window.addEventListener("error", function (event) {
    console.log(event);
});
```
