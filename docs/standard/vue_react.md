---
title: vue/react规范
date: 2022-3-12
tags:
    - 规范
categories:
    - 规范
---

## vue2 规范

### 文件/文件夹命名

- index.js/index.vue，非组件或类，使用小写字母开头的，- 分隔符
- 组件或者类，使用大驼峰

### 文件位置

- 全局通用组件放在 /src/components 下
- 业务模块放在 /src/pages 下，业务组件放在各自目录的 components 文件夹下
- 静态文件放在 /src/assets 下，如图片，less/scss 全局变量
- 配置文件放在 /src/config 下
- ts 定义 /src/interface 
- 路由 /src/router
- 公共通用方法 /src/utils
- 布局 /src/layouts
- 使用vuex /src/store
- 接口 /src/api

#### src 目录

```
- [src]
    - [components]
    - [pages]
    - [assets]
    - [config]
    - [interface]
    - [router]
    - [utils]
    - [layouts]
    - [store]
    - [api]
```

#### 公共组件

```
- [components]
    - [Breadcrumb]
        - index.vue
    - [Table]
        - index.vue
    - [SvgIcon]
        - index.vue
```

#### 业务模块

```
- [pages]
    - [system]
        - [menu-manage]
            - [components]
            - index.vue
        - [role-manage]
            - [components]
            - index.vue
    - [home]
        - [components]
        - index.vue
```

### 组件

- 组件中没有内容，应该自闭合
- 标签中使用为大驼峰
  
```
<!-- bad -->
<table-component> </table-component>

<!-- good -->
<TableComponent />
```

### props 通讯

- 内容详细，有默认值
  
```
<!-- bad -->
maxCount: Number;

<!-- good -->
maxCount: {
    type: Number,
    default: 0,
}
```

### API 顺序

```
export default {
    name: '',
    extends: '', // extends和mixins都扩展逻辑，需要重点放前面
    mixins: [],   
    components: {},

    /* 2. Vue数据 */
    props: {},
    model: { prop: '', event: '' }, // model 会使用到 props
    data () {
        return {}
    },
    computed: {},
    watch:{}, // watch 监控的是 props 和 data，有必要时监控computed

    /* 3. Vue资源 */
    filters: {},
    directives: {},

    /* 4. Vue生命周期 */
    created () {},
    mounted () {},
    destroy () {},

    /* 5. Vue方法 */
    methods: {}, 
}
```

### import 引入顺序

- 同类型放在一起，并空一行
- 先放第三方再放自己的组件
  
```
<!-- bad -->
import { Table, Form } from 'element-ui'
import { getCookies } from '@/utils'
import { helpers } from 'vuelidate/lib/validators'

<!-- good -->
import { Table, Form } from 'element-ui'
import { helpers } from 'vuelidate/lib/validators'

import { getCookies } from '@/utils'
```

## vue3 和 react 规范

### hooks

- 自定义 hooks 放在 /src/hooks 下，hooks 的说明和参数、返回值需要表明
- 业务和 hooks 需要放在一块

#### 业务模块

```
/********* 数据模块 ************/
const [staticColumns, setStaticColumns] = useState([]);
const columns = useMemo(() => {
    return [
        {
            title: '规则名称',
            dataIndex: 'ruleName',
            width: 140,
        },
        {
            title: '涉及类型',
            dataIndex: 'code',
            width: 140,
            valueType: 'select',
            fieldProps: {
                options: PeopleCategory,
            },
        }
    ];
}, [])

/********* 弹框模块 ************/
const [editorVisiable, setEditorVisiable] = useState(false);
const [editorData, setEditorData] = useState({});

// 编辑按钮事件
const onEditor = (data) => {
    setEditorData(data);
    setEditorVisiable(true);
};

```