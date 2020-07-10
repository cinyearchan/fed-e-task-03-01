# 一、简答题

1. 当我们点击按钮的时候动态给 data 增加的成员是否是响应式数据，如果不是的话，如果把新增成员设置成响应式数据，它的内部原理是什么

   ```js
   let vm = new Vue({
     el: '#el',
     data: {
       o: 'object',
       dog: {}
     },
     methods: {
       clickHandler () {
         // 该 name 属性是否是响应式的
         this.dog.name = 'Trump'
       }
     }
   })
   ```

   不是响应式数据

   Vue.js 通过 Object.defineProperty 来将对象的 key 转换成 getter/setter 的形式来追踪变化，但 getter/setter 只能追踪一个数据是否被修改，无法追踪新增属性和删除属性，自然无法侦测到上述数据的变化，也就不会向依赖发送通知

   ```js
   // 在方法内部，确保 this 指向当前 vue 实例
   this.$set(this.dog, 'name', 'Trump')
   ```

   

2. 请简述 Diff 算法的执行过程





# 二、编程题

1. 模拟 VueRouter 的 hash 模式的实现，实现思路和 History 模式类似，把 URL 中的 # 后面的内容作为路由的地址，可以通过 hashchange 事件监听路由地址的变化

   [项目地址](https://github.com/cinyearchan/fed-e-task-03-01/tree/master/code/custom-tiny-vue-router)

2. 在模拟 Vue.js 响应式源码的基础上实现 v-html 指令，以及 v-on 指令

   [项目地址](https://github.com/cinyearchan/fed-e-task-03-01/blob/master/code/custom-tiny-vue)

   [v-html 指令支持代码](https://github.com/cinyearchan/fed-e-task-03-01/blob/b1e6817e7ab01e0f25354c0e09313197819f1847/code/custom-tiny-vue/lib/Compiler.js#L80-L85)

   [v-on 指令支持代码](https://github.com/cinyearchan/fed-e-task-03-01/blob/b1e6817e7ab01e0f25354c0e09313197819f1847/code/custom-tiny-vue/lib/Compiler.js#L88-L101)

   [新增对注释节点的判断](https://github.com/cinyearchan/fed-e-task-03-01/blob/b1e6817e7ab01e0f25354c0e09313197819f1847/code/custom-tiny-vue/lib/Compiler.js#L13-L21)

   [指令判断中增加对 v-on 以及 v-on简写 @ 的支持](https://github.com/cinyearchan/fed-e-task-03-01/blob/b1e6817e7ab01e0f25354c0e09313197819f1847/code/custom-tiny-vue/lib/Compiler.js#L36-L51)

3. 参考 Snabbdom 提供的电影列表的示例，实现类似的效果 

   <iframe src="http://snabbdom.github.io/snabbdom/examples/reorder-animation/" height="600"></iframe>




















































