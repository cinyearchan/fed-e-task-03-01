# 虚拟 DOM 简介

## 虚拟 DOM 概念

> 任何应用都有状态，并不是只有使用了现代比较流行的框架之后才有状态。
>
> 只是现代框架揭露了：关注点应该聚焦在状态维护上，而 DOM 操作是可以省略掉的。

> 状态可以是 JavaScript 中的任意类型—— Object、Array、String、Number、Boolean 等，这些状态可能最终会以段落、表单、链接或按钮等元素呈现在用户界面上，具体地说是呈现在页面上
>
> 通常程序在运行时，状态会不断发生变化（有可能是用户点击了某个按钮，也可能是某个 Ajax 请求，这些行为都是异步发生的）。每当状态发生变化时，都需要重新渲染。而直接访问 DOM 进行更新是非常昂贵的，会造成相当多的性能浪费

虚拟 DOM 的解决方式是：

通过状态生成一个虚拟节点树，然后使用虚拟节点树进行渲染。在渲染之前，会使用新生成的虚拟节点树和上一次生成的虚拟节点树进行对比，只渲染不同的部分。



## 引入虚拟 DOM 原因

1. Vue.js 的变化侦测，在一定程度上知道具体哪些状态发生了变化，可以通过更细粒度的绑定来更新视图

2. 出于粒度的考量

   粒度太细，每一个绑定都会有一个对应的 watcher 来观察状态的变化，会有一些内存开销以及一些依赖追踪的开销。状态被越多的节点使用，开销越大。

出于上述两点原因，Vue.js 2.0 选用中等粒度解决方案——引入虚拟 DOM——组件级别是一个 watcher 实例，状态发生变化时，只通知到组件，组件内部通过虚拟 DOM 进行比对和渲染

### 虚拟 DOM 在 Vue.js 中的主要作用

- 提供与真实 DOM 节点所对应的虚拟节点 vnode
- 将虚拟节点 vnode 和旧虚拟节点 oldVnode 进行比对，然后更新视图

---

## VNode

Vue.js 中存在一个 VNode 类，用于实例化不同类型的 vnode 实例，不同类型的 vnode 实例各自表示不同类型的 DOM 元素
VNode 类的代码如下：
```js
export default class VNode {
	constructor (tag, data, children, text, elm, context, componentOptions, asyncFactory) {
		this.tag = tag
		this.data = data
		this.children = children
		this.text = text
		this.elm = elm
		this.ns = undefined
		this.context = context
		this.functionalContext = undefined
		this.functionalOptions = undefined
		this.functionalScopeId = undefined
		this.key = data && data.key
		this.componentOptions = componentOptions
		this.componentInstance = undefined
		this.parent = undefined
		this.raw = false
		this.isStatic = false
		this.isRootInsert = true
		this.isComment = false
		this.isCloned = false
		this.isOnce = false
		this.asyncFactory = asyncFactory
		this.asyncMeta = undefined
		this.isAsyncPlaceholder = false
	}
	
	get child () {
		return this.componentInstance
	}
}
```

vnode 可以理解为**节点描述对象**，描述了应该怎样去创建真实的 DOM 节点


### VNode 的作用
每次渲染视图时都是先创建 vnode，再使用 vnode 创建真实 DOM 插入到页面中
可以将上一次渲染视图时创建的 vnode 缓存起来，之后每当需要重新渲染视图时，将新创建的 vnode 和上一次缓存的 vnode 进行比对，只更新发生变化的节点，并基于此去修改真实的 DOM，避免性能浪费


### VNode 的类型
1. 注释节点
	```js
	export const createEmptyVNode = text => {
		const node = new VNode()
		node.text = text
		node.isComment = true
		return node
	}
	// 注释节点只有两个有效属性—— text 和 isComment
	// 其余属性都是默认的 undefined 或者 false
	```
	真实的注释节点
	```html
	<!-- 注释节点 -->
	```
	对应的 vnode
	```js
	{
		text: "注释节点",
		isComment: true
	}
	```
	
2. 文本节点

   ```js
   export function createTextVNode (val) {
     return new VNode(undefined, undefined, undefined, String(val))
   }
   ```

   文本类型的 vnode 被创建时，只有一个 text 属性

   ```js
   {
     text: "Hello World"
   }
   ```

   

3. 元素节点

   通常存在4种有效属性

   - tag：节点的名称，例如 p、ul、li、div 等
   - data：包含节点上的一些数据，比如 attrs、class 和 style 等
   - children：当前节点的子节点列表
   - context：当前组件的 Vue.js 实例

   真实的元素节点

   ```html
   <p><span>Hello</span><span>World</span></p>
   ```

   对应的 vnode

   ```js
   {
     children: [VNode, VNode],
     context: {...},
     data: {...},
     tag: "p",
     ......
   }
   ```

   

4. 组件节点

   组件节点和元素节点类似，有以下两个独有属性

   - componentOptions：组件节点的选项参数，包含 propsData、tag 和 children 等信息
   - componentInstance：组件的实例，即 Vue.js 的实例

   一个组件节点

   ```html
   <child></child>
   ```

   对应的 vnode

   ```js
   {
     componentInstance: {...},
     componentOptions: {...},
     context: {...},
     data: {...},
     tag: "vue-component-1-child",
     ......
   }
   ```

   

5. 函数式节点

   与组件节点类似，有两个独有属性

   - functionalContext
   - functionalOptions

   vnode 如下

   ```js
   {
     functionalContext: {...},
     functionalOptions: {...},
     context: {...},
     data: {...},
     tag: "div"
   }
   ```

   

6. 克隆节点

   将现有节点的属性复制到新节点中，让新创建的节点和被克隆节点的属性保持一致，实现克隆效果，优化静态节点和插槽节点（slot node）

   静态节点除了首次渲染需要执行渲染函数获取 vnode 之外，后续更新不需要执行渲染函数重新生成 vnode，使用创建克隆节点的方法将 vnode 克隆一份，使用克隆节点进行渲染，提升性能

   创建克隆节点的函数

   ```js
   export function cloneVNode (vnode, deep) {
     const cloned = new VNode(
     	vnode.tag,
       vnode.data,
       vnode.children,
       vnode.text,
       vnode.elm,
       vnode.context,
       vnode.componentOptions,
       vnode.asyncFactory
     )
     cloned.ns = vnode.ns
     cloned.isStatic = vnode.isStatic
     cloned.key = vnode.key
     cloned.isComment = vnode.isComment
     cloned.isCloned = true
     if (deep && vnode.children) {
       cloned.children = cloneVNode(vnode.children)
     }
     return cloned
   }
   ```

   克隆节点和被克隆节点的唯一区别是 isCloned 属性

   - 克隆节点的 isCloned 为 true
   - 被克隆的原始节点的 isCloned 为 false




















