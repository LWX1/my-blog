---
title: 请求规范
date: 2022-3-10
tags:
    - 规范
categories:
    - 规范
---

## axios 规范

### 响应时间

```
axios.defaults.timeout = 300000; // 5 min
axios.defaults.headers.post['Content-Type'] = 'application/json';
```

### 请求拦截

```
axios.interceptors.request.use(
  (config) => {
    // 设置token
    config.headers['token'] = localStorage.getItem('token');
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
```

### 响应拦截

```
axios.interceptors.response.use(
  (response: any) => {
    if (response.status >= 400) {
      // 未登录或token过期
      if (response.status === 401) {
        // window.location.href = '/login'
        return
      }
      return Promise.reject(response)
    }
    return response
  },
  (error) => {
    if (error.response.status === 401) {
      message.error('登录过期，请重新登录');
    }
    const err = error.response.data
    message.error(err.msg)
    return Promise.reject(err)
  }
)

```

