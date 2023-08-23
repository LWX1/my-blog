---
title: 路由规范
date: 2022-3-13
tags:
    - 规范
categories:
    - 规范
---

## router 规范

### 路由

- 路由尽量使用懒加载
- 定义在一个数组中

```js
import { prefixRoute } from "src/configs";

import Home from "src/pages/Home";
import H5Layouts from "src/pages/h5";

const allRouter = [
	{
		tag: "Redirect",
		from: "/",
		to: prefixRoute + "/home",
		exact: true,
	},
	{
		tag: "Route",
		from: "首页",
		path: prefixRoute + "/home",
		component: Home,
	},
	
	
	{
		tag: "Route",
		name: "h5",
		path: prefixRoute + "/h5",
		component: H5Layouts,
		children: [
			{
				tag: "Route",
				name: "首页",
				path: prefixRoute + "/home",
				component: lazy(() => import("../pages/home")),
				exact: true
			},
		]
	},
	{
		tag: "Route",
		component: lazy(() => import("../pages/NotFound"))
	}
]
```


