---
title: 组件通讯
date: 2020-3-2
isShowComments: false 
---
## vue组件
vue是一个组件化框架，每个模块都是由一个个组件组合而来的，从而成为一个页面。那我们是不是应该思考，在vue中各个组件之间的通讯是怎么样进行的。
### 通讯方式
#### 1. props/$emit
-   父组件通过props向子组件传递，子组件通过$emit向父组件触发方法。该方式无法直接进行兄弟之间的通讯。
```
// parent.vue
<ChildrenCom  :info="{a:1}" @sendParentData="getChildrenData"/>
methods: {
    getChildrenData(value) {
        console.log(value) // {b:1}
    }
}
// ChildrenCom.vue
<div @click="sendData"></div>
props: {
        info: Object,
},
mounted() {
    console.log(this.info) // {a:1}
}
methods: {
    // 点击触发方法，进而触发父组件的方法
    sendData() {
        this.$emit("sendParentData", {b:1})
    }
}
```
#### 2. $emit/$on
- 该方式通过空的vue实例作为事件中心，用它来触发和监听事件，实现了任何组件之间的通信。

```
// 在main.js中new Vue之前定义；挂载到原型链上；
Vue.prototype.$selfEvent = new Vue();
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
// 父组件
<span @click="sendData">点击</span>
mounted() {
    this.$selfEvent.$on('sendChildren', (res) => {
        console.log("来自子组件的方法", res); // 来自子组件的方法  孩子触发
    });
}
methods: {
    sendData() {
        this.$selfEvent.$emit('sendData', 2, 3, 4);
    }
}
// 子组件
<span @click="sendData">点击 </span>
mounted() {
    this.$selfEvent.$on('sendData', (...res) => {
        console.log("接收父组件的方法", res); // 接收父组件的方法 [2,3,4]
    });
    this.$selfEvent.$on('sendBrotherData', (...res) => {
        console.log("接收父兄弟组件的方法", res); // 接收父兄弟组件的方法 [1,2,3]
    });
}
methods: {
    sendData() {
        this.$selfEvent.$emit('sendChildren', '孩子触发');
        this.$selfEvent.$emit('sendBrother', '兄弟触发');
    }
}
// 兄弟组件
mounted() {
    this.$selfEvent.$on('sendBrother', (...res) => {
        console.log("接收兄弟组件的方法", res); // 接收兄弟组件的方法 兄弟触发
    });
}

```
#### 3. $attrs/$listeners
- 多级数组嵌套传递数据时，通常是使用vuex；但当数据不做处理，且只有小部分需要多层传，我们可以试一下$attrs/$listeners；
- <span style="color: #1890ff">$attrs：</span>父组件中不被prop获取的特性绑定（class和style除外）和组件中没在prop中声明的变量都可以在$attrs中获取到   
- <span style="color: #1890ff">$listeners：</span>父作用域中的 (不含 .native 修饰器的) v-on 事件监听器。
```
// app组件
<Parent
    :info="{a:1}"
    :info2="{b:1}"
    @getData="getData"
/>
// 父组件
<ChildrenCom v-bind="$attrs" :info3="3" v-on="$listeners"/>
props: {
    info: Object,
},
mounted() {
    console.log('attrs', this.$attrs) // attrs, {info2: {b:1}}
    console.log('listeners', this.$listeners)  // listeners, {getData: f}
}
// 子组件
mounted() {
    console.log('attrs', this.$attrs) // attrs, {info2: {b:1}, info3: 3}
    console.log('listeners', this.$listeners)  // listeners, {getData: f}
}
```
#### 4. provide/inject
- Vue2.2.0新增API,这对选项需要一起使用，以允许一个祖先组件向其所有子孙后代注入一个依赖，不论组件层次有多深。通过provide注入，inject获取；
- 需要注意的是：provide 和 inject 绑定并不是可响应的。这是刻意为之的。然而，如果你传入了一个可监听的对象，那么其对象的属性还是可响应的；
```
// app组件
<div @click="changeName">改变名字</div>
<Parent></parent>

provide() {
    return {
        nameObj: this.nameObj,
        name: this.name
    };
},
data() {
    return {
        nameObj: {
            name: '小刘'
        },
        name: '小青'
    }
},
methods: {
    changeName() {
        this.nameObj.name = '666';
        this.name = '小黄';
    }
}
// 子组件
<span>
    {{nameObj.name}}--{{name}}  // 未点击为 小刘--小青； 点击后 666--小青；
</span>
inject: ['nameObj', 'name']
```
- 说明：只有相应式的数据才能变化，name是常量，没有监听，所以无法变化；

#### 5. $parent / $children与 ref
- <span style="color: #1890ff">ref：</span>如果在普通的 DOM 元素上使用，引用指向的就是 DOM 元素；如果用在子组件上，引用就指向组件实例
- <span style="color: #1890ff">$parent / $children：</span>访问父/子
```
// 父组件
<ChildrenCom ref="child"/>
mounted() {
    console.log('$children', this.$children) // 所有孩子数组实例
    console.log('ref', this.$refs.child)  // 子孩子数组实例
}
// 子组件
mounted() {
    console.log('$parent',this.$parent) // 父亲实例
}

```

#### 6. vuex
- 该技术我们到时单独讲