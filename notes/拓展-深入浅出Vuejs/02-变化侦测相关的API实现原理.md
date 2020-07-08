# vm.$watch

## 用法

```js
/**
 * @param expOrFn {string | Function}
 * @param callback {Function | Object}
 * @param [option] {Object}
 *         deep {boolean}
 *         immediate {boolean}
 * return unwatch {Function}
 * 用于观察一个表达式或 computed 函数在 Vue.js 实例上的变化
 * 回调函数调用时，会从参数得到新数据（new value）和旧数据（old value）
 * 表达式只接受以点分隔的路径，如果是一个比较复杂的表达式，可以用函数代替
 */
vm.$watch(expOrFn, callback, [options])

// example
var unwatch = vm.$watch('a.b.c', function (newVal, oldVal) {
  // do something
})

// 之后取消观察
unwatch()

// deep 发现对象内部值的变化
vm.$watch('someObject', callback, {
  deep: true
})
vm.someObject.nestedValue = 123
// 回调函数将被触发

// immediate 为 true 时，将立即以表达式的当前值触发回调
vm.$watch('a', callback, {
  immediate: true
})
// 立即以 'a' 的当前值触发回调
```



## watch 的内部原理

`vm.$watch` 其实是对 Watcher 的一种封装

通过 Watcher 完全可以实现 `vm.$watch` 的功能，但 `vm.$watch` 中的参数 deep 和 immediate 是 Watcher 中所没有的

```js
Vue.prototype.$watch = function (expOrFn, cb, options) {
  const vm = this
  options = options || {}
  const watcher = new Watcher(vm, expOrFn, cb, options)
  if (options.immediate) {
    cb.call(vm, watcher.value)
  }
  return function unwatchFn () {
    watcher.teardown()
  }
}
```

**注意**：expOrFn 是支持函数的，需要对之前的 Watcher 进行修改

```js
export default class Watcher {
  constructor (vm, expOrFn, cb) {
    this.vm = vm
    // expOrFn 参数支持函数
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
    }
    this.cb = cb
    this.value = this.get()
  }
  
  ...
}
```

>  当 expOrFn 是函数时，不止可以动态返回数据，其中读取的所有数据也都会被 Watcher 观察

当 expOrFn 是字符串类型的 keypath 是，Watcher 会读取这个 keypath 所指向的数据并观察这个数据的变化；当 expOrFn 是函数时，Watcher 会同时观察 expOrFn 函数中读取的所有 Vue.js 实例上的响应式数据

而最后返回的函数 unwatchFn，内部执行了 watcher.teardown() 来取消观察数据，本质上是把 watcher 实例从当前正在观察的状态的依赖列表中移除

> 首先，需要在 Watcher 中记录自己都订阅了谁，即 watcher 实例被收集进了哪些 Dep 里
>
> 然后，当 Watcher 不想继续订阅这些 Dep 时，循环自己的订阅列表来通知它们（Dep）将自己从它们（Dep）的依赖列表中移除掉

```js
export default class Watcher {
  constructor (vm, expOrFn, cb) {
    this.vm = vm
    this.deps = [] // 新增
    this.depIds = new Set() // 新增
    this.getter = parsePath(expOrFn)
    this.cb = cb
    // 读数据会触发收集依赖
    this.value = this.get()
  }
  
  ...
  
  addDep (dep) {
    const id = dep.id
    // 判断当前 Watcher 是否订阅了该 Dep，避免 Dep 中的依赖有重复
    if (!this.depIds.has(id)) {
      // 记录当前 Watcher 已经订阅了该 Dep
      this.depIds.add(id)
      // 记录自己都订阅了哪些 Dep
      this.deps.push(dep)
      // 将自己 watcher 订阅到 Dep 中
      dep.addSub(this)
    }
  }
}
```

Dep 中收集依赖的逻辑同时需要更新

```js
let uid = 0 // 新增

export default class Dep {
  constructor () {
    this.d = uid++ // 新增
    this.subs = []
  }
  
  ...
  
  depend () {
    if (window.target) {
      // this.assSub(window.target) // 废弃
      window.target.addDep(this) // 新增
    }
  }

	...
}
```

此时，Dep 会记录数据发生变化时，需要通知哪些 Watcher，而 Watcher 中也同样记录了自己会被哪些 Dep 通知，它们之间是多对多的关系

因为 expOrFn 可以是一个函数，此时如果该函数中是用了多个数据，那 Watcher 就要收集多个 Dep

```js
this.$watch(function () {
  return this.name + this.age
}, function (newValue, oldValue) {
  console.log(newValue, oldValue)
})
```

Watcher 内部会收集两个 Dep——name 的 Dep 和 age 的 Dep，同时这两个 Dep 也会收集 Watcher，age 和 name 中的任意一个数据发生变化，Watcher 都会收到通知

**teardown 实现取消观察**：

```js
/**
 * 从所有依赖项的 Dep 列表中将自己移除
 */
teardown () {
  let i = this.deps.length
  while (i--) {
    this.deps[i].removeSub(this)
  }
}
```

```js
export default class Dep {
  ...
  
  // Dep 中移除 Watcher
  removeSub (sub) {
    const index = this.subs.indexOf(sub)
    if (index > -1) {
      return this.subs.splice(index, 1)
    }
  }
}
```

**deep 参数的实现原理**

Watcher 想要监听某个数据，就会触发某个数据收集依赖的逻辑，将自己收集进去，然后当它发生变化时，就会通知 Watcher

deep 参数实现的功能，本质就是，除了要触发当前这个被监听数据的收集依赖的逻辑之外，还要把当前监听的这个值在内的所有子值都触发一遍收集依赖逻辑

```js
export default class Watcher {
  constructor (vm, expOrFn, cb, options) {
    this.vm = vm
    
    // 新增
    if (options) {
      this.deep = !!options.deep
    } else {
      this.deep = false
    }
    
    this.deps = []
    this.depIds = new Set()
    this.getter = parsePath(expOrFn)
    this.cb = cb
    this.value = this.get()
  }
  
  get () {
    window.target = this
    let value = this.getter.call(vm, vm)
    // 新增
    if (this.deep) {
      traverse(value)
    }
    // 一定要在 window.target = undefined 之前触发子值的收集依赖逻辑，保证子值收集的依赖是当前这个 Watcher
    window.target = undefined
    return value
  }
  
  ...
}
```

递归 value 的所有子值来触发它们收集依赖

```js
const seenObjects = new Set()

export function traverse (val) {
  _traverse(val, seenObjects)
  seenObjects.clear()
}

function _traverse (val, seen) {
  let i, keys
  const isA = Array.isArray(val)
  // 不是 Array 和 Object，或者已经被冻结，直接返回
  if ((!isA && !isObject(val)) || Object.isFrozen(val)) {
    return
  }
  if (val.__ob__) {
    // 用 dep.id 保证不会重复收集依赖
    const depId = val.__ob__.dep.id
    if (seen.has(depId)) {
      return
    }
    seen.add(depId)
  }
  // 如果是数组，循环数组，每一项递归调用 _traverse
  if (isA) {
    i = val.length
    while (i--) _traverse(val[i], seen)
  } else {
    // 如果是 Object 类型，循环 Object 中的所有 key，执行一次读取操作，再递归子值
    keys = Object.keys(val)
    i = keys.length
    // val[keys[i]] 会触发 getter，触发收集依赖的操作，
    // window.target 还没被清空，会将当前的 Watcher 收集进去
    while (i--) _traverse(val[keys[i]], seen)
  }
}
```



---



# vm.$set

## 用法

```js
/**
 * @param target {Object | Array}
 * @param key {string | number}
 * @param value {any}
 * return unwatch {Function}
 * 在 object 上设置一个属性，如果 object 是响应式的，Vue.js 会保证属性被创建后也是响应式的，并且触发视图更新
 * 主要用来避开 Vue.js 不能侦测属性被添加的限制
 */
vm.$set(target, key, value)
```

> target 不能是 Vue.js 实例或者 Vue.js 实例的根数据对象

```js
var vm = new Vue({
  el: '#el',
  template: '#demo-template',
  methods: {
    action () {
      this.obj.name = 'hello'
    }
  },
  data: {
    obj: {}
  }
})
```

当 action 方法被调用时，会为 obj 新增一个 name 属性，而 Vue.js 并不会得到任何通知，新增的属性也不是响应式的

vm.$set 实现：

```js
import { set } from '../observer/index'
Vue.prototype.$set = set
```



## set 内部原理

```js
export function set (target, key, val) {
  // 对 Array 的处理
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    // 调用数组的 splice，拦截器会进行拦截（Array 的变化侦测）
    // 会自动将新增的 val 转换成响应式的
    target.splice(key, 1, val)
    return val
  }
  
  // 如果 key 已经存在于 target 中
  // 表明这个 key 已经被侦测了变化
  // 属于修改数据
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  
  // 处理新增的属性
  const ob = target.__ob__
  // 判断 target 是不是 Vue 实例
  // 判断它是不是根数据对象
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
    	'Avoid adding reactive properties to a Vue instance or its root $data' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  // 如果 target 没有 __ob__ 属性，说明它不是响应式的
  // 不需要做什么特殊处理，只需要通过 key 和 val 在 target 上设置就行
  if (!ob) {
    target[key] = val // 相当于简单的给普通对象新增属性
    return val
  }
  // target 是响应式数据，此时的操作是在响应式数据上新增了属性
  // 需要追踪这个新增属性的变化，使用 defineReactive 将新增属性转换成 getter/setter
  defineReactive(ob.value, key, val)
  // 向 target 的依赖触发变化通知
  ob.dep.notify()
  return val
}
```

> 不能使用 `vm.$set` 在根数据 `this.$data` 上“追加新建一级数据”



---



# vm.$delete

如果数据是使用 delete 关键字删除的，则无法发现数据发生了变化（不知道数据被删除了），因此，Vue.js 提供了 vm.$delete 方法来删除数据中的某个属性，并且此时可以侦测到数据发生了变化

## 用法

```js
/**
 * @param target {Object | Array}
 * @param key/index {string | number}
 * 删除对象的属性
 * 如果对象是响应式的，需要确保删除能触发更新视图
 */
vm.$delete(target, key)
```

> 目标对象不能是 Vue.js 实例或 Vue.js 实例的根数据对象



## delete 实现原理

ES6 之前，JavaScript 并没有办法侦测到一个属性在 object 中被删除

Vue.js 使用 vm.$delete，在删除属性后自动向依赖发送消息，通知 Watcher 数据发生了变化

使用 delete 取巧的办法：

```js
delete this.obj.name
this.obj.__ob__.dep.notify() // 手动向依赖发送变化通知
```

**不推荐上述方法**

但 vm.$delete 内部的实现原理和上述方法非常类似

```js
import { del } from '../observer/index'
Vue.prototype.$delete = del
```

```js
export function del (target, key) {
  const ob = target.__ob__
  delete target[key]
  ob.dep.notify()
}
```

**先从 target 中将属性 key 删除，然后向依赖发送消息**

处理数组的情况：

```js
export function del (target, key) {
  // 新增
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    // 拦截器
    // 删除数据后会自动发送通知（响应式数据）
    target.splice(key, 1)
    return
  }
  const ob = (target).__ob__
  
  // 排除 Vue 实例和根数据对象
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
    	'Avoid deleting properties on a Vue instance or its root $data' + 
      '- just set it to null'
    )
    return
  }
  
  // 如果 key 不是 target 自身的属性，则终止程序继续执行
  if (!hasOwn(target, key)) {
    // target 中不存在 key 属性，则不需要进行删除操作，也不需要向依赖发送通知
    return
  }
  delete target[key]
  
  // 如果 ob 不存在，则直接终止程序
  if (!ob) {
    // 如果数据不是响应式的，则不需要发送通知
    return
  }
  ob.dep.notify()
}
```

