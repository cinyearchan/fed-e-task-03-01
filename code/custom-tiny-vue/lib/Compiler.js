class Compiler {
  constructor (vm) {
    this.el = vm.$el
    this.vm = vm
    this.compile(this.el)
  }
  // 编译模板，处理文本节点和元素节点
  compile (el) {
    let childNodes = el.childNodes
    // 遍历 el 中的所有子节点
    Array.from(childNodes).forEach(node => {
      // 处理文本节点
      if (this.isTextNode(node)) {
        this.compileText(node)
      } else if (this.isElementNode(node)) {
        // 处理元素节点
        this.compileElement(node)
      } else {
        // 处理注释节点
        console.log('出现注释节点，忽略即可')
      }

      // 判断 node 节点，是否有子节点，如果有子节点，要递归调用 compile
      if (node.childNodes && node.childNodes.length) {
        this.compile(node)
      }
    })
  }
  // 编译元素节点，处理指令
  compileElement (node) {
    // 遍历所有的属性节点
    Array.from(node.attributes).forEach(attr => {
      // 判断是否是指令
      let attrName = attr.name
      let modifiers = ''
      if (this.isDirective(attrName)) {
        // v-text --> text 
        // v-model --> model
        // v-html --> html
        if (this.isDirectiveOn(attrName)) {
          // 获取修饰符
          modifiers = attrName.split('.')
          attrName = 'on'
        } else {
          attrName = attrName.substr(2)
        }

        // v-text = msg，此处获取 msg 的字符名
        let key = attr.value
        this.update(node, key, attrName, modifiers)
      }
    })
  }
  // 处理指令相关的功能
  update (node, key, attrName, modifiers) {
    let updateFn = this[attrName + 'Updater']
    // 确保 updateFn 内的 update 方法 this 指向 compiler 类
    updateFn && updateFn.call(this, node, attrName !== 'on' ? this.vm[key] : this.vm.$options.methods[key], key, modifiers)
  }
  // 处理 v-text 指令
  textUpdater (node, value, key) {
    node.textContent = value
    new Watcher(this.vm, key, (newValue) => {
      node.textContent = newValue
    })
  }
  // 处理 v-model 指令
  modelUpdater (node, value, key) {
    node.value = value
    new Watcher(this.vm, key, (newValue) => {
      node.value = newValue
    })
    // 双向绑定
    node.addEventListener('input', () => {
      this.vm[key] = node.value
    })
  }

  // 处理 v-html 指令
  htmlUpdater (node, value, key) {
    node.innerHTML = value
    new Watcher(this.vm, key, (newValue) => {
      node.innerHTML = newValue
    })
  }

  // 处理 v-on 指令（v-on 可简写为 @，另外，是否需要考虑修饰符的使用？）
  onUpdater (node, value, key, modifiers) {
    // console.log(node, value, key, modifiers)
    // modifiers 修饰符数组第一项为 完整指令
    let directive = modifiers[0]
    // 如果是 v-on
    // 如果是 @
    let event = directive.startsWith('v-on') ? directive.substr(5) : directive.substr(1)
    // console.log(event)
    node.addEventListener(event, (e) => {
      modifiers.includes('stop') && e.stopPropagation()
      modifiers.includes('prevent') && e.preventDefault()
      value.call(this.vm)
    })
  }

  // 编译文本节点，处理差值表达式
  compileText (node) {
    // {{ msg }}
    let reg = /\{\{(.+?)\}\}/
    let value = node.textContent
    if (reg.test(value)) {
      // 获取 msg 的字符名
      let key = RegExp.$1.trim()
      node.textContent = value.replace(reg, this.vm[key])

      // 创建 watcher 对象，当数据改变更新视图
      new Watcher(this.vm, key, (newValue) => {
        node.textContent = newValue
      })
    }
  }
  // 判断元素属性是否是指令
  isDirective (attrName) {
    return attrName.startsWith('v-') || attrName.startsWith('@')
  }
  // 判断指令是否是 v-on/@
  isDirectiveOn (attrName) {
    return attrName.startsWith('v-on') || attrName.startsWith('@')
  }

  // 判断节点是否是文本节点
  isTextNode (node) {
    return node.nodeType === 3
  }
  // 判断节点是否是元素节点
  isElementNode (node) {
    return node.nodeType === 1
  }
}