### Virtual DOM 的实现原理

---

#### 虚拟 DOM

是由普通的 JS 对象来描述 DOM 对象，因为不是真实的 DOM 对象，所以叫 Virtual DOM

- 真实 DOM 成员

  ```js
  let element = document.querySelector('#app')
  let s = ''
  for (var key in element) {
    s += key + ','
  }
  console.log(s)
  ```

- 用 Virtual DOM 来描述真实 DOM

  ```js
  {
    sel: "div",
    data: {},
    children: undefined,
    text: "Hello Virtual DOM",
    elm: undefined,
    key: undefined
  }
  ```



##### 使用 Virtual DOM 原因

- 手动操作 DOM 比较麻烦，还需要考虑浏览器兼容性问题，虽然有 jQuery 等库简化 DOM 操作，但是随着项目的复杂度提升，DOM 操作的复杂度也会提升
- 为了简化 DOM 的复杂操作浴室出现了各种 MVVM 框架，MVVM 框架解决了视图和状态的同步问题
- 为了简化视图的操作可以使用模板引擎，但是模板引擎没有解决跟踪状态变化的问题
- Virtual DOM 在状态改变时不需要立即更新 DOM，只需要创建一个虚拟树来描述 DOM，Virtual DOM 内部将弄清楚如何有效（diff）的更新 DOM
- 参考 github 上 [virtual-dom](https://github.com/Matt-Esch/virtual-dom) 的描述
  - 虚拟 DOM 可以维护程序的状态，跟踪上一次的状态
  - 通过比较前后两次状态的差异更新真实 DOM



##### 虚拟 DOM 的作用

- 维护视图和状态的关系
- 复杂视图情况下提升渲染性能
- 除了渲染 DOM 外，还可以实现 SSR(Nuxt.js/Next.js)、原生应用(Weex/React Native)、小程序(mpvue/uni-app)等

##### Virtual DOM 库

- [Snabbdom](https://github.com/snabbdom/snabbdom)
  - Vue 2.x 内部使用的 Virtual DOM 就是改造的 Snabbdom
  - 大约200 SLOC(single line of code)
  - 通过模块可扩展
  - 源码使用 TypeScript 开发
  - 最快的 Virtual DOM 之一
- [virtual-dom](https://github.com/Matt-Esch/virtual-dom)

---

#### Snabbdom 基本使用

##### 创建项目

打包工具使用 parcel 为例

```shell
# 创建项目目录
md snabbdom-demo
# 进入项目目录
cd snabbdom-demo
# 创建 package.json
yarn init -y
# 本地安装 parcel
yarn add parcel-bundler
```

配置 package.json 的 scripts 字段

```js
"scripts": {
  "dev": "parcel index.html --open",
  "build": "parcel build index.html"
}
```

创建目录结构

```
|-index.html
|-package.json
|-src
  |-01-basicusage.js
```

安装 Snabbdom

```shell
yarn add snabbdom@0.7.3
```

导入 Snabbdom

> 官网 demo 中导入使用的是 commonjs 模块化语法，这里使用 ES6 的 import

```js
import { init, h, thunk } from 'snabbdom'
```

Snabbdom 的核心仅提供最基本的功能，只导出三个函数 `init()`、`h()`、`thunk()`

- `init()` 是一个高阶函数，返回 `patch()`

- `h()` 返回虚拟节点 `VNode`，该函数在使用 Vue.js 时出现过

  ```js
  new Vue({
    router,
    store,
    render: h => h(App)
  }).$mount('#app')
  ```

- `thunk()` 是一种优化策略，可以在处理不可变数据时使用

*注意* 导入时不能使用 `import snabbdom from 'snabbdom'`

```js
// node_modules/src/snabbdom.ts 末尾导出使用的语法是 export 导出 API，没有使用 export default 导出默认输出
export {h} from './h'
export {thunk} from './thunk'

export function init(modules: Array<Partial<Module>>, domApi?: DOMAPI){}
```

代码

```js
// snabbdom@0.7.3

import { h, init } from 'snabbdom'

// 案例1. hello world
// 参数：数组，模块
// 返回值：patch 函数，作用：对比两个 vnode 的差异更新到真实 DOM
let patch = init([])
// 第一个参数：标签+选择器
// 第二个参数：如果是字符串的话就是标签中的内容
let vnode = h('div#container.cls', 'Hello World')

let app = document.querySelector('#app')
// 第一个参数：可以是 DOM 元素，内部会把 DOM 元素转换成 VNode
// 第二个参数：VNode
// 返回值：VNode
let oldVnode = patch(app, vnode)

// 虚拟 DOM 发生变化
vnode = h('div', 'Hello Snabbdom')
patch(oldVnode, vnode)

// ----------------------------------------------------

// 案例2：div 中放置子元素 h1,p
let vnode2 = h('div#wrapper', [
  h('h1', 'Hello Snabbdom'),
  h('p', '这是一个 p 标签')
])

let app2 = document.querySelector('#app2')
let oldVnode2 = patch(app2, vnode2)

setTimeout(() => {
  vnode2 = h('div#wrapper', [
    h('h1', 'Hello World'),
    h('p', 'Hello P')
  ])
  patch(oldVnode2, vnode2)
  
  // 清空页面元素
  patch(oldVnode2, h('!')) // 生成注释节点
  // patch(oldVnode2, null) 官网例子是错误的
}, 2000)
```



##### Snabbdom 中的模块

Snabbdom 的核心库不能处理元素的属性、样式、事件等，如果需要处理的话，需要使用模块

###### 常用模块

- attributes
  - 设置 DOM 元素的属性，使用 `setAttribute()`
  - 处理布尔类型的属性
- props
  - 和 attributes 模块类似，设置 DOM 元素的属性 `element[attr] = value`
  - 不处理布尔类型的属性
- class
  - 切换类样式
  - 注意：给元素设置类样式是通过 `sel` 选择器
- dataset
  - 设置 `data-*` 的自定义属性
- eventlitenners
  - 注册和移除事件
- style
  - 设置行内样式，支持动画
  - delayed/remove/destroy

###### 使用模块

步骤

1. 导入需要的模块
2. `init()` 中注册模块
3. 使用 `h()` 函数创建 VNode 的时候，可以把第二个参数设置为对象，其他参数往后移

代码

```js
import { h, init } from 'snabbdom'
// 导入需要的模块
import style from 'snabbdom/modules/style'
import eventlisteners from 'snabbdom/modules/eventlisteners'
// 使用 init() 函数创建 patch()
// init() 的参数是数组，将来可以传入模块，处理属性、样式、事件等
let patch = init([
  style,
  eventlisteners
])

// 使用 h() 函数创建 VNode
let vnode = h('div', {
  style: {
    backgroundColor: 'red'
  },
  on: {
    click: eventHandler
  }
}, [
  h('h1', 'Hello Snabbdom'),
  h('p', 'this is p tag')
])
  
function eventHandler {
  console.log('click')
}

let app = document.querySelector('#app')

patch(app, vnode)
```



##### Snabbdom 源码解析

核心

- 使用 h() 函数创建 JavaScript 对象（VNode）描述真实 DOM
- init() 设置模块，创建 patch()
- patch() 比较新旧两个 VNode
- 把变化的内容更新到真实 DOM 树上

###### h 函数

- h 函数最早见于 hyperscript，使用 JavaScript 创建超文本
- Snabbdom 中的 h() 函数不是用来创建超文本，而是创建 VNode

函数重载

- 概念

  - **参数个数**或**类型**不同的函数
  - JavaScript 中没有重载的概念
  - TypeScript 中有重载，不过重载的实现还是通过代码调整参数

- 示意

  ```js
  function add(a, b) {
    console.log(a, b)
  }
  function add(a, b, c) {
    console.log(a + b + c)
  }
  add(1, 2)
  add(1, 2, 3)
  ```

  

源码 src/h.ts

```typescript
import { vnode, VNode, VNodeData } from './vnode'
import * as is from './is'

export type VNodes = VNode[]
export type VNodeChildElement = VNode | string | number | undefined | null
export type ArrayOrElement<T> = T | T[]
export type VNodeChildren = ArrayOrElement<VNodeChildElement>

function addNS (data: any, children: VNodes | undefined, sel: string | undefined): void {
  data.ns = 'http://www.w3.org/2000/svg'
  if (sel !== 'foreignObject' && children !== undefined) {
    for (let i = 0; i < children.length; ++i) {
      const childData = children[i].data
      if (childData !== undefined) {
        addNS(childData, (children[i] as VNode).children as VNodes, children[i].sel)
      }
    }
  }
}

// h 函数的重载 及 导出
export function h(sel: string): VNode
export function h(sel: string, data: VNodeData | null): VNode
export function h(sel: string, children: VNodeChildren): VNode
export function h(sel: string, data: VNodeData | null, children: VNodeChildren): VNode
export function h (sel: any, b?: any, c?: any): VNode {
  var data: VNodeData = {}
  var children: any
  var text: any
  var i: number
  // 处理参数，实现重载的机制
  if (c !== undefined) {
    // 处理三个参数的情况
    // sel、data、children/text
    if (b !== null) {
      data = b
    }
    if (is.array(c)) {
      children = c
      // 如果 c 是字符串或者数字
    } else if (is.primitive(c)) {
      text = c
      // 如果 c 是 VNode
    } else if (c && c.sel) {
      children = [c]
    }
  } else if (b !== undefined && b !== null) {
    // 处理两个参数的情况
    // 如果 b 是数组
    if (is.array(b)) {
      children = b
      // 如果 b 是字符串或者数字
    } else if (is.primitive(b)) {
      text = b
      // 如果 b 是 VNode
    } else if (b && b.sel) {
      children = [b]
    } else { data = b }
  }
  if (children !== undefined) {
    // 处理 children 中的原始值（string/number）
    for (i = 0; i < children.length; ++i) {
      // 如果 child 是 string/number，创建文本节点
      if (is.primitive(children[i])) children[i] = vnode(undefined, undefined, undefined, children[i], undefined)
    }
  }
  if (
    sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
    (sel.length === 3 || sel[3] === '.' || sel[3] === '#')
  ) {
    // 如果是 svg，添加命名空间
    addNS(data, children, sel)
  }
  // 返回 VNode
  return vnode(sel, data, children, text, undefined)
};
```



###### vnode 函数

源码 src/vnode.ts

```typescript
export interface VNode {
  // 选择器
  sel: string | undefined;
  // 节点数据：属性、样式、事件等
  data: VNodeData | undefined;
  // 子节点，和 text 只能互斥
  children: Array<VNode | string> | undefined;
  // 记录 vnode 对应的真实 DOM
  elm: Node | undefined;
  // 节点中的内容，和 children 只能互斥
  text: string | undefined;
  // 优化用
  key: key | undefined;
}
```



###### VNode 渲染成真实 DOM——patch 的整体过程

- patch(oldVnode, newVnode)
- 打补丁，把新节点中变化的内容渲染到真实 DOM，最后返回新节点作为下一次处理的久节点
- 对比新旧 VNode 是否相同节点（节点的 key 和 sel 相同）
- 如果不是相同节点，删除之前的内容，重新渲染
- 如果是相同节点，再判断新的 VNode 是否有 text，如果有并且和 oldVnode 的 text 不同，直接更新文本内容
- 如果新的 VNode 有 children，判断子节点是否有变化，判断子节点的过程是否的就是 diff 算法
- diff 过程只进行同层级比较



###### init 函数

snabbdom@0.7.3/src/snabbdom.ts

```typescript
export function init(modules: Array<Partial<Module>>, domApi?: DOMAPI) {
  let i: number, j: number, cbs = ({} as ModuleHooks);
  // 初始化转换虚拟节点的 api
  const api: DOMAPI = domApi !== undefined ? domApi : htmlDomApi;
  // 把传入的所有模块的钩子函数，统一存储到 cbs 对象中
  // 最终构建的 cbs 对象的形式 cbs ={ create: [fn1, fn2], update: [], ... }
  for (i = 0; i < hooks.length; ++i) {
    // cbs.create = [], cbs.update = []...
    cbs[hooks[i]] = [];
    for (j = 0; j < modules.length; ++j) {
      // modules 传入的模块数组
      // 获取模块中的 hook 函数
      // hook = modules[0][create]......
      const hook = modules[j][hooks[i]]
      if (hook !== undefined) {
        // 把获取到的 hook 函数放入到 cbs 对应的钩子函数数组中
        (cbs[hooks[i]] as any[]).push(hook)
      }
    }
  }
  
  // init 内部返回 patch 函数，把 vnode 渲染成真实 DOM，并返回 vnode
  return function patch(oldVnode: VNode | Element, vnode: VNode): VNode {}
}
```



###### patch 函数

snabbdom@0.7.3/src/snabbdom.ts

```typescript
return function patch(oldVnode: VNode | Element, vnode: VNode): VNode {
  let i: number, elm: Node, parent: Node;
  // 保存新插入节点的队列，为了触发钩子函数
  const insertedVnodeQueue: VNodeQueue = [];
  // 执行模块的 pre 钩子函数
  for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]()
  
  // 如果 oldVnode 不是 VNode，创建 VNode 并设置 elm
  if (!isVnode(oldVnode)) {
    // 把 DOM 元素转换成空的 VNode
    oldVnode = emptyNodeAt(oldVnode)
  }
  // 如果新旧节点是相同节点（key 和 sel 相同）
  if (sameVnode(oldVnode, vnode)) {
    // 找节点的差异并更新 DOM
    patchVnode(oldVnode, vnode, insertedVnodeQueue)
  } else {
    // 如果新旧节点不同，vnode 创建对应的 DOM
    // 获取当前的 DOM 元素
    elm = oldVnode.elm!;
    parent = api.parentNode(elm);
    // 创建 vnode 对应的 DOM 元素，并触发 init/create 钩子函数
    createElm(vnode, insertedVnodeQueue)
    
    if (parent !== null) {
      // 如果父节点不为空，把 vnode 对应的 DOM 插入到文档中
      // vnode.elm! ts 语法，百分之百有值
      api.insertBefore(parent, vnode.elm!, api.nextSibling(elm))
      // 移除老节点
      removeVnodes(parent, [oldVnode], 0, 0)
    }
  }
  // 执行用户设置的 insert 钩子函数
  for (i = 0; i < insertedVnodeQueue.length; ++i) {
    insertedVnodeQueue[i].data!.hook!.insert!(insertedVnodeQueue[i])
  }
  // 执行模块的 post 钩子函数
  for (i = 0; i < cbs.post.length; ++i) cbs.post[i]()
  // 返回 vnode
  return vnode
}
```



###### createElm 函数

snabbdom@0.7.3/src/snabbdom.ts 将 VNode 转换成对应的 DOM 元素

```typescript
function createElm(vnode: VNode, insertedVnodeQueue: VNodeQueue): Node {
  let i: any, data = vnode.data;
  if (data !== undefined) {
    // 执行用户设置的 init 钩子函数
    const init = data.hook?.init
    if (isDef(init)) {
      init(vnode)
      // init 是用户设置的钩子函数，可能会对 vnode.data 做修改
      // 重新赋值，保证 data 是最新的 vnode.data
      data = vnode.data
    }
  }
  // 把 vnode 转换成真实 DOM 对象（没有渲染到页面）
  let children = vnode.children, sel = vnode.sel
  if (sel === '!') {
    // 创建注释节点
    if (isUndef(vnode.text)) {
      vnode.text = ''
    }
    vnode.elm = api.createComment(vnode.text!)
  } else if (sel !== undefined) {
    // 创建 DOM 元素
    
    // 如果选择器不为空
    // 解析选择器
    // Parse selector
    
    
    // 执行模块的 create 钩子函数
    for (i = 0; i < cbs.create.length; ++i) cbs.create[i](emptyNode, vnode)
    // 如果 vnode 中有子节点，创建子 vnode 对应的 DOM 元素并追加到 DOM 树上
    if (is.array(children)) {
      for (i = 0; i < children.length; ++i) {
        const ch = children[i]
        if (ch != null) {
          api.appendChild(elm, createElm(ch as VNode, insertedVnodeQueue))
        }
      }
    } else if (is.primitive(vnode.text)) {
      // 如果 vnode 的 text 值是 string/number，创建文本节点并追加到 DOM 树
      api.appendChild(elm, api.createTextNode(vnode.text))
    }
    const hook = vnode.data!.hook
  } else {
    // 创建文本节点
    vnode.elm = api.createTextNode(vnode.text!)
  }
  // 返回新创建的 DOM
  return vnode.elm
}
```

逻辑表示如下：

1. 触发用户钩子函数 init
2. 把 vnode 转换成 DOM 对象，存储到 vnode.elm 中（**注意：没有渲染到页面**）
   - sel 是 `!`：创建注释节点
   - sel 不为空：
     - 创建对应的 DOM 对象
     - 触发 **模块** 的钩子函数 create
     - 创建所有子节点对应的 DOM 对象
     - 触发 **用户** 的钩子函数 create
     - 如果 vnode 有 insert 钩子函数，追加到队列
   - sel 为空：创建文本节点
3. 返回 vnode.elm

调试 createElm

```js
import { h, init } from 'snabbdom'

let patch = init([])

let vnode = h('div#container.cls', {
  hook: {
    init (vnode) {
      console.log(vnode.elm)
    },
    create (emptyVnode, vnode) {
      console.log(vnode.elm)
    }
  }
}, 'Hello World')

let app = document.querySelector('#app')

let oldVnode = patch(app, vnode)

vnode = h('div', 'Hello Snabbdom')

patch(oldVnode, vnode)
```



###### addVnodes 和 removeVnodes

添加和移除虚拟节点

- Vnodes

  ```typescript
  function removeVnodes(parentElm: Node, vnodes: VNode[], startIdx: number, endIdx: number): void {
    for (; startIdx <= endIdx; ++startIdx) {
      let listeners: number, rm: () => void, ch = vnodes[startIdx];
      if (ch != null) {
        // 如果 sel 有值
        if (isDef(ch.sel)) {
          // 执行 destroy 钩子函数（会执行所有子节点的 destroy 钩子函数）
          invokeDestroyHook(ch)
          listeners = cbs.remove.length + 1
          // 创建删除的回调函数
          rm = createRmCb(ch.elm!, listeners)
          for (let i = 0; i < cbs.remove.length; ++i) cbs.remove[i](ch, rm)
          // 执行用户设置的 remove 钩子函数
          const removeHook = ch?.data?.hook?.remove
          if (isDef(removeHook)) {
            removeHook(ch, rm)
          } else {
            // 如果没有用户钩子函数，直接调用删除元素的方法
            rm()
          }
        } else { // Text node
          // 如果是文本节点，直接调用删除元素的方法
          api.removeChild(parentElm, ch.elm!)
        }
      }
    }
  }
  
  
  function invokeDestroyHook(vnode: VNode) {
    const data = vnode.data
    if (data !== undefined) {
      // 执行用户设置的 destroy 钩子函数
      data?.hook?.destroy?.(vnode)
      // 调用模块的 destroy 钩子函数
      for (let i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode)
      // 执行子节点的 destroy 钩子函数
      if (vnode.children !== undefined) {
        for (let j = 0; j < vnode.children.length; ++j) {
          const child = vnode.children[j]
          if (child != null && typeof child !== "string") {
            invokeDestroyHook(child)
          }
        }
      }
    }
  }
  
  function createRmCh(childElm: Node, listeners: number) {
    // 返回删除元素的回调函数
    return function rmCb() {
      if (--listeners === 0) {
        const parent = api.parentNode(childElm)
        api.removeChild(parent, childElm)
      }
    }
  }
  ```

- addVnodes

  ```typescript
  function addVnodes(parentElm: Node, before: Node | null, vnodes: VNode[], startIdx: number, endIdx: number, insertedVnodeQueue: VNodeQueue) {
    for (; startIdx <= endIdx; ++startIdx) {
      const ch = vnodes[startIdx]
      if (ch != null) {
        api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before)
      }
    }
  }
  ```

  

###### patchVnode

snabbdom@0.7.3/src/snabbdom.ts/init/patch

```typescript
// init 内部返回 patch 函数，把 vnode 渲染成真实 dom，并返回 vnode
return function patch(oldVnode: VNode | Element, vnode: VNode): VNode {
  let i: number, elm: Node, parent: Node;
  // 保存新插入节点的队列，为了触发钩子函数
  const insertedVnodeQueue: VNodeQueue = [];
  // 执行模块的 pre 钩子函数
  for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]();
  
  // 如果 oldVnode 不是 VNode，创建 VNode 并设置 elm
  if (!isVnode(oldVnode)) {
    // 把 DOM 元素转换成空的 VNode
    oldVnode = emptyNodeAt(oldVnode)
  }
  // 如果新旧节点是相同节点（key 和 sel 相同）
  if (sameVnode(oldVnode, vnode)) {
    // 找节点的差异并更新 DOM
    patchVnode(oldVnode, vnode, insertedVnodeQueue)
  } else {
    // 如果新旧节点不同，vnode 创建对应的 DOM
    // 创建当前的 DOM 元素
    elm = oldVnode.elm!
    parent = api.parentNode(elm)
    // 创建 vnode 对应的 DOM 元素，并触发 init/create 钩子函数
    createElm(vnode, insertedVnodeQueue)
    
    if (parent !== null) {
      // 如果父节点不为空，把 vnode 对应的 DOM 插入到文档中
      api.insertBefore(parent, vnode.elm as Node, api.nextSibling(elm))
      removeVnodes(parent, [oldVnode], 0, 0)
    }
  }
  
  for (i = 0; i < insertedVnodeQueue.length; ++i) {
    (((insertedVnodeQueue[i].data as VNodeData).hook as Hooks).insert as any)(insertedVnodeQueue[i]);
  }
  for (i = 0; i < cbs.post.length; ++i) cbs.post[i]();
  return vnode
}


// patchVnode
function patchVnode(oldVnode: VNode, vnode: VNode, insertedVnodeQueue: VNodeQueue) {
  
  // 1. 执行两个钩子函数
  
  const hook = vnode.data?.hook
  // 首先执行用户设置的 prepatch 钩子函数
  hook?.prepatch?.(oldVnode, vnode)
  const elm = vnode.elm = oldVnode.elm!;
  let oldCh = oldVnode.children as VNode[];
  let ch = vnode.children as VNode[];
  // 如果新老 vnode 相同返回
  if (oldVnode === vnode) return;
  if (vnode.data !== undefined) {
    // 执行模块的 update 钩子函数
    for (let i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode)
    // 执行用户设置的 update 钩子函数
    vnode.data.hook?.update?.(oldVnode, vnode)
  }
  
  // 2. 对比两个 vnode
  
  // 如果 vnode.text 未定义
  if (isUndef(vnode.text)) {
    // 如果新老节点都有 children
    if (isDef(oldCn) && isDef(ch)) {
      // 使用 diff 算法对比子节点，更新子节点
      if (oldCh !== ch) updateChildren(elm, oldCh as Array<VNode>, ch as Array<VNode>, insertedVnodeQueue);
    } else if (isDef(ch)) {
      // 如果新节点有 children，老节点没有 children
      // 如果老节点有 text，清空 dom 元素的内容
      if (isDef(oldVnode.text)) api.setTextContent(elm, '');
      // 批量添加子节点
      addVnodes(elm, null, ch as Array<VNode>, 0, (ch as Array<VNode>).length - 1, insertedVnodeQueue);
    } else if (isDef(oldCh)) {
      // 如果老节点有 children，新节点没有 children
      // 批量移除子节点
      removeVnodes(elm, oldCh as Array<VNode>, 0, (oldCh as Array<VNode>).length - 1);
    } else if (isDef(oldVnode.text)) {
      // 如果老节点有 text，清空 DOM 元素
      api.setTextContent(elm, '')
    }
  } else if (oldVnode.text !== vnode.text) {
    // 如果没有设置 vnode.text
    if (isDef(oldCh)) {
      // 如果老节点有 children，移除
      removeVnodes(elm, oldCh as Array<VNode>, 0, (oldCh as Array<VNode>).length - 1);
    }
    api.setTextContent(elm, vnode.text as string);
  }
  
  // 3.
  
  // 最后执行用户设置的 postpatch 钩子函数
  hook?.postpatch?.(oldVnode, vnode)
}
```



内部逻辑

1. 触发 prepatch 钩子函数
2. 触发 update 钩子函数
3. 新节点有 text 属性，且不等于旧节点的 text 属性
   - 如果老节点有 children
     - 移除老节点 children 对应的 DOM 元素
   - 设置新节点对应 DOM 元素的 textContent
4. 新老节点
   - 新老节点都有 children，且不相等
     - 调用 updateChildren()
     - 对比子节点，并且更新子节点的差异
   - 只有新节点有 children 属性
     - 如果老节点有 text 属性
       - 清空对应 DOM 元素的 textContent
     - 添加所有的子节点
   - 只有老节点有 children 属性
     - 移除所有的老节点
5. 只有老节点有 text 属性
   - 清空对应 DOM 元素的 textContent
6. 触发 postpatch 钩子函数



###### updateChildren

- 功能

  diff 算法的核心，对比新旧节点的 children，更新 DOM

- 执行过程

  - 要对比两棵树的差异，可以取第一棵树的每一个节点依次和第二棵树的每一个节点比较，但是这样的时间复杂度为 O(n^3)

  - 在 DOM 操作的时候很少会把一个父节点移动、更新到某一个子节点

  - 因此只需要找**同级别**的子**节点**依次**比较**，然后再找下一级别的节点比较，这样算法的时间复杂度为O(n)

  - 在进行同级别节点比较时，首先会对新老节点数组的开始和结尾节点设置标记索引，遍历的过程中移动索引

  - 在对**开始和结束节点**比较时，总共有四种情况：

    1. oldstartVnode / newStartVnode（旧开始节点、新开始节点）
    2. oldEndVnode / newEndVnode（旧结束节点、新结束节点）
    3. oldStartVnode / newEndVnode（旧开始节点、新结束节点）
    4. oldEndVnode / newStartVnode（旧结束节点、新开始节点）

    > 开始节点和结束节点比较，这两种情况类似
    >
    > - oldStartVnode / newStartVnode（旧开始节点、新开始节点）
    > - oldEndVnode / newEndVnode（旧结束节点、新结束节点）
    >
    > 如果 oldStartVnode 和 newStartVnode 是 sameVnode（key 和 sel 相同）
    >
    > 1. 调用 patchVnode() 对比和更新节点
    > 2. 把旧开始和新开始索引往后移动 oldStartIdx++ / oldEndIdx++

    > oldStartVnode / newEndVnode（旧开始节点、新结束节点）相同
    >
    > 1. 调用 patchVnode() 对比和更新节点
    > 2. 把 oldStartVnode 对应的 DOM 元素，移动到右边
    > 3. 更新索引

    > oldEndVnode / newStartVnode（旧结束节点、新开始节点）相同
    >
    > 1. 调用 patchVnode() 对比和更新节点
    > 2. 把 oldEndVnode 对应的 DOM 元素，移动到左边
    > 3. 更新索引

  - 如果以上四种情况都不满足

    1. 遍历新节点，使用 newStartNode 的 key 在老节点数组中找相同节点
       - 如果没有找到，说明 newStartNode 是新节点
         - 创建新节点对应的 DOM 元素，插入到 DOM 树中
       - 如果找到了
         - 判断新节点和找到的老节点的 sel 选择器是否相同
           - 如果不相同，说明节点被修改了
             - 重新创建对应的 DOM 元素，插入到 DOM 树中
           - 如果相同，把 elmToMove 对应的 DOM 元素，移动到左边

  - 循环结束

    - 当老节点的所有子节点先遍历完（oldStartIdx > oldEndIdx），循环结束
    - 新节点的所有子节点先遍历完（newStartIdx > newEndIdx），循环结束

    > - 如果老节点的数组先遍历完（oldStartIdx > oldEndIdx），说明新节点有剩余，把剩余节点批量插入到右边
    > - 如果新节点的数组先遍历完（newStartIdx > newEndIdx），说明老节点有剩余，把剩余节点批量删除

- 源码

  ```typescript
  function updateChildren(parentElm: Node,
                          oldCh: Array<VNode>,
                          newCh: Array<VNode>,
                          insertedVnodeQueue: VNodeQueue) {
    // 老开始节点索引，新开始节点索引
    let oldStartIdx = 0, newStartIdx = 0;
    // 老结束节点索引
    let oldEndIdx = oldCh.length - 1;
    // 老开始节点
    let oldStartVnode = oldCh[0];
    // 老结束节点
    let oldEndVnode = oldCh[oldEndIdx];
    // 新结束节点索引
    let newEndIdx = newCh.length - 1;
    // 新开始节点
    let newStartVnode = newCh[0];
    // 新结束节点
    let newEndVnode = newCh[newEndIdx];
    let oldKeyToIdx: KeyToIndexMap | undefined;
    let idxInOld: number;
    let elmToMove: VNode;
    let before: any;
    
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      // 索引变化后，可能会把节点设置为空
      if (oldStartVnode == null) {
        // 节点为空移动索引
        oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved
      } else if (oldEndVnode == null) {
        oldEndVnode = oldCh[--oldEndIdx];
      } else if (newStartVnode == null) {
        newStartVnode = newCh[++newStartIdx];
      } else if (newEndVnode == null) {
        newEndVnode = newCh[--newEndIdx];
        // 比较开始和结束节点的四种情况
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        // 1. 比较老开始节点和新开始节点
        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
        oldStartVnode = oldCh[++oldStartIdx];
        newStartVnode = newCh[++newStartIdx];
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        // 2. 比较老结束节点和新结束节点
        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
        oldEndVnode = oldCh[--oldEndIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
        // 3. 比较老开始节点和新结束节点
        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
        api.insertBefore(parentElm, oldStartVnode.elm!, api.nextSibling(oldEndVnode.elm!));
        oldStartVnode = oldCh[++oldStartIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
        // 4. 比较老结束节点和新开始节点
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue)
        api.insertBefore(parentElm, oldEndVnode.elm!, oldStartVnode.elm!)
        oldEndVnode = oldCh[--oldEndIdx];
        newStartVnode = newCh[++newStartIdx];
      } else {
        // 开始节点和结束节点都不相同
        // 使用 newStartNode 和 key 在老节点数组中找相同节点
        // 先设置记录 key 和 index 的对象
        if (oldKeyToIdx === undefined) {
          oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
        }
        // 遍历 newStartVnode，从老的节点中找相同 key 的 oldVnode 的索引
        idxInOld = oldKeyToIdx[newStartVnode.key]
        // 如果是新的 vnode
        if (isUndef(idxInOld)) { // New element
          // 如果没找到，newStartNode 是新节点
          // 创建元素插入 DOM 树
          api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm)
          // 重新给 newStartVnode 赋值，指向下一个新节点
          newStartVnode = newCh[++newStartIdx]
        } else {
          // 如果找到相同的 key 相同的老节点，记录到 elmToMove 遍历
          elmToMove = oldCh[idxInOld];
          if (elmToMove.sel !== newStartVnode.sel) {
            // 如果新旧节点的选择器不同
            // 创建新开始节点对应的 DOM 元素，插入到 DOM 树中
            api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm)
          } else {
            // 如果相同，patchVnode()
            // 把 elmToMove 对应的 DOM 元素，移动到左边
            patchVnode(elmToMove, newStartVnode, insertedVnodeQueue)
            oldCh[idxInOld] = undefined
            api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm)
          }
          // 重新给 newStartVnode 赋值，指向下一个新节点
          newStartVnode = newCh[++newStartIdx]
        }
      }
    }
    // 循环结束，老节点数组先遍历完成或新节点数组先遍历完成
    if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
      if (oldStartIdx > oldEndIdx) {
        // 如果老节点数组先遍历完成，说明有新的节点剩余
        // 把剩余的新节点都插入到右边
        before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
        addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
      } else {
        // 如果新节点数组先遍历完成，说明老节点有剩余
        // 批量删除老节点
        removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx)
      }
    }
  }
  ```

  

---

##### Modules 源码

- patch() -> patchVnode() -> updateChildren()
- Snabbdom 为了保证核心库的精简，把处理元素的属性、事件、样式等工作，放置到模块中
- 模块可以按需引入
- 模块实现的核心是基于 Hooks

###### Hooks

- 预定义的钩子函数的名称

- 源码位置： src/hooks.ts

  ```typescript
  export interface Hooks {
    // patch 函数开始执行的时候触发
    pre?: PreHook;
    // createElm 函数开始之前的时候触发
    // 在把 VNode 转换成真实 DOM 之前触发
    init?: InitHook;
    // createElm 函数末尾调用
    // 创建完真实 DOM 后触发
    create?: CreateHook;
    // patch 函数末尾执行
    // 真实 DOM 添加到 DOM 树中触发
    insert?: InsertHook;
    // patchVnode 函数开头调用
    // 开始对比两个 VNode 的差异之前触发
    prepatch?: PrePatchHook;
    // patchVnode 函数开头调用
    // 两个 VNode 对比过程中触发，比 prepatch 稍晚
    update?: UpdateHook;
    // patchVnode 的最末尾调用
    // 两个 VNode 对比结束执行
    postpatch?: PostPatchHook;
    // removeVnodes -> invokeDestroyHook 中调用
    // 在删除元素之前触发，子节点的 destroy 也被触发
    destroy?: DestroyHook;
    // removeVnodes 中调用
    // 元素被删除的时候触发
    remove?: RemoveHook;
    // patch 函数的最后调用
    post?: PostHook;
  }
  ```

  