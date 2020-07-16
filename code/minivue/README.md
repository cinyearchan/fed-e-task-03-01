在引入 Vue 文件时，Vue 本身会有几个类函数和一个处理函数集合

- observer
- watcher
- dep
- directive
- directives

---

- 实例化时

  1. 调用 initData、initMethod 等一系列方法，将数据挂载到 Vue 实例上，这样可以通过 vm.name 或者 vm.sayHi 直接读取数据和调用函数

  2. 调用 observe(data) 对数据进行监听，即调用 Object.defineProperty() 方法，对每一个 key 都建立一个 dep 实例，并在 getter 和 setter 做了一些设置，当访问这一个 key 的 getter 就会触发 getter 函数里的 dep.depend 方法收集依赖（watcher 实例），当对这一个 key 赋值时，就会触发 setter 里的 dep.notify() 方法，通知 dep 收集的所有 watcher 实例调用 update 方法进行更新

  3. 上一步完成之后就会调用 compile 函数开始对 DOM 进行解析，例子里的 div 只有一个文本节点，首先会解析 div 里的 {{name}} 因为 div 没有指令，所以解析完后不会生成指令，解析 {{name}} 时会生成一个 text 指令，并把 {{name}} 替换为一个空的文本节点，然后生成一个描述符对象
  
     ```js
     descriptor = {
       name: 'text',
       expression: 'name',
       el: node, // 替换 {{name}} 的文本节点
       def: directives[text], // 对应的处理函数
     }
     ```
  
     描述符对象收集了后面生成指令实例时所需要的数据，要监听的表达式 'name'，对应的文本节点，和指令对应的处理函数（这个是手动加上去的）
  
  4. 然后会将这个描述符对象当做参数传入 directive 类，生成一个指令实例
  
  5. 指令实例执行 bind 方法，bind 方法会将表达式、指令处理函数以及相关的一些参数传给 watcher 生成一个 watcher 实例
  
  6. watcher 首次会执行 get 方法，对表达式进行求值，也就是取得 vm.name 的值，然后将得到的值传给 update 方法
  
  7. update 方法将值传入处理函数对 DOM 进行更新，完成第一次渲染



- 实例化完成之后

  之后每一个更改 name 的值，都会触发 name 这个 key 的 setter 方法，setter 方法再触发 dep.notify 通知对应的 watcher 调用 update 方法进行更新，update 方法再把值传给对应的处理函数，再一次进行 DOM 渲染
  
  其余指令也是按照上述流程来运行的



```shell
# 执行命令查看效果
npm run dev
```



> 备注：项目基于 [minivue](https://github.com/woai3c/minivue)，原项目并未考虑 v-for 指令中，数组元素中嵌套的情况，现已解决:
>
> ```js
> [{name: 'xiaoming', age: 18}, {name: 'xiaohong', 17}]
> ```
>
> 另外，解决了 @click 绑定的事件处理函数，参数传递的问题