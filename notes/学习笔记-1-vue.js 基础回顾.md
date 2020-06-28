### Vue.js 基础回顾

---

#### 概要

- Vue.js 基础语法
- Vue Router 原理分析与实现
- 虚拟 DOM 库 Snabbdom 源码解析
- 响应式原理分析与实现
- Vue.js 源码分析

---

#### Vue.js 基础结构

```vue
<div id="app"></div>
<script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
<script>
	new Vue({
    data: {
      company: {
        name: 'ali'，
        address: '杭州'
      },
      render(h) {
        return h('div', [
          h('p', '公司名称：' + this.company.name),
          h('p', '公司地址：' + this.company.address)
        ])
      }
    }
  }).$mount('#app')
</script>
```



#### Vue 的生命周期



#### Vue 语法和概念

- 插值表达式
- 指令
- 计算属性和侦听器
- Class 和 Style 绑定
- 条件渲染、列表渲染
- 表单输入绑定
- 组件
- 插槽
- 插件
- 混入 mixin
- 深入响应式原理
- 不同构建版本的 Vue