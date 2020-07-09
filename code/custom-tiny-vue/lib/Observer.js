// 负责数据劫持
// 把 $data 中的成员转换成 getter/setter
class Observer {
  constructor (data) {
    this.walk(data)
  }
  walk (data) {
    // 1. 判断 data 是否是对象
    if (!data || typeof data !== 'object') {
      return
    }
    // 2. 遍历 data 对象的所有属性
    Object.keys(data).forEach(key => {
      this.defineReactive(data, key, data[key])
    })
  }
  defineReactive (obj, key, val) {
    let that = this
    // 负责收集依赖，并发送通知
    let dep = new Dep()
    // 如果 val 是对象，把 val 内部的属性转换成响应式数据
    this.walk(val)
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get () {
        // 收集依赖
        Dep.target && dep.addSub(Dep.target)
        return val // 此处不能使用 obj[key]，不然会发生死递归
      },
      set (newValue) {
        if (newValue === val) {
          return
        }
        val = newValue
        that.walk(newValue)
        // 发送通知
        dep.notify()
      }
    })
  }
}