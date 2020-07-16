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

   开始，比对新旧两个 vnode 之间有哪些不同：

   - 当一个虚拟节点在 oldVnode 中不存在而在 vnode 中存在（vnode 和 oldVnode 完全不是同一个节点）时，会执行新增节点
   - 当一个节点只存在于 oldVnode 中，需要把它从 DOM 移除（删除节点）
   - 当 oldVnode 和 vnode 是同一个节点时，需要进行更细致的对比操作，通过比对找出新旧两个节点不一样的地方，针对那些不一样的地方进行更新
     - 新旧两个虚拟节点是否是静态节点，如果是，不进行更新操作，跳过
     - 新旧两个虚拟节点不是静态节点
       - vnode 有 text 属性，调用 setTextContent 将 DOM 节点的内容改为 vnode 的 text 属性保存的文字；如果 oldVnode 也有 text 属性，且文本一致，无需调用 setTextContent
       - vnode 无 text 属性
         - vnode 无 children 属性，说明该 vnode 是一个空节点，oldVnode 中有子节点就删除子节点，有文本就删除文本，使得视图中是空标签
         - vnode 有 children 属性
           - oldVnode 也没有 children 属性，说明 oldVnode 要么是空标签，要么是有文本的文本节点：如果是文本节点，先把文本清空变成空标签，然后将 vnode 中的 children 挨个创建成真实的 DOM 元素节点并插入到视图的 DOM 节点下面
           - oldVnode 也有 children 属性，需要对新旧两个虚拟节点的 children 进行更详细的对比并更新，即子节点的更新操作

   子节点的更新操作：

   循环 newChildren（新子节点列表），每循环到一个新子节点，就去 oldChildren（旧子节点列表）中找和当前节点相同的那个旧子节点：

   - 如果在 oldChildren 中找不到，说明当前子节点是由于状态变化而新增的节点，创建该子节点并插入到 oldChildren 中所有未处理节点的前面
   - 如果在 oldChildren 中找到了
     - 新旧两个子节点是同一个节点并且位置相同，进行上述的更新节点的操作
     - 新旧两个子节点是同一个节点，但位置不同，需要把这个节点移动到所有未处理节点的最前面
   - newChildren 中所有节点都被循环了一遍，oldChildren 中如果还有剩余节点没有处理，说明这些节点是被废弃的，直接删除这些子节点

   子节点更新的优化策略：

   通常并不是所有子节点的位置都会发生移动，可以借助快速查找位置可以预测的节点的方式提高效率：

   1. 新前与旧前，如果是同一节点，进行更新操作，不需要移动节点；如果不是，尝试下一种方式
   2. 新后与旧后，如果是同一节点，进行更新操作，不需要移动节点；如果不是，尝试下一种方式
   3. 新后与旧前，如果是同一节点，进行更新操作，需要移动节点，移动到 oldChildren 中所有未处理节点的最后面；如果不是，尝试下一种方式
   4. 新前与旧后，如果是同一节点，进行更新操作，需要移动节点，移动到 oldChildren 中所有未处理节点的最后面；如果不是，通过循环的方式去 oldChildren 中详细找一圈

   上述优化策略，不再是只处理所有未处理过的节点的第一个，而是有可能会处理最后一个，这种情况下不能从前向后循环，而是从两边向中间循环：

   - oldStartIdx：oldChildren 的开始位置下标
   - oldEndIdx：oldChildren 的结束位置下标
   - newStartIdx：newChildren 的开始位置下标
   - newEndIdx：newChildren 的结束位置下标

   oldStartIdx 和 newStartIdx 只能向后移动，oldEndIdx 和 newEndIdx 只能向前移动，当开始位置大于等于结束位置时，说明所有节点都遍历过了，结束循环

   - 如果 oldChilren 先循环完毕，newChildren 中如果还有剩余节点，newStartIdx < newEndIdx，说明下标在 newStartIdx 和 newEndIdx 之间的这些节点都是新增的，直接把这些节点插入到 DOM 中
   - 如果 newChildren 先循环完毕，oldChildren 中如果还有剩余节点，oldStartIdx < oldEndIdx，说明下标在 oldStartIdx 和 oldEndIdx 之间的这些节点都是废弃的，直接把这些节点从 DOM 移除



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
   
   [项目地址](https://github.com/cinyearchan/fed-e-task-03-01/tree/master/code/minivue)


















































