### Vue-Router 原理实现

---

#### 概要

- Vue-Router 基础回顾
- Hash 模式和 History 模式
- 模拟实现自己的 Vue Router

---

#### 使用步骤

1. 注册路由插件 `Vue.use(VueRouter)`

   Vue.use 是用来注册插件，会调用传入对象的 install 方法

   定义路由规则

   ```js
   const routes = []
   ```

   

2. 创建 router 对象

   ```js
   const router = new VueRouter({
     routes
   })
   ```

   

3. 注册 router 对象

   ```js
   new Vue({
     router,
     render: h => h(App)
   }).$mount('#app')
   ```

   

4. 创建路由组件的占位 router-view

5. 创建连接 router-link



#### 动态路由

对路由规则 routes

```js
const routes = [
  {
    path: '/',
    name: 'Index',
    component: Index
  }, {
    path: '/detail/:id',
    name: 'Detail',
    // 开启 props，会把 URL 中的参数传递给组件
    // 在组件中通过 props 来接收 URL 参数
    props: true,
    component: () => import(/* webpackChunkName: "detail" */ '../views/Detail.vue')
  }
]
```

组件中获取参数

```vue
<template>
	<div>
    <!-- 方式一：通过当前路由规则，获取数据 -->
    通过当前路由规则获取：{{ $route.params.id }}
    <br>
    <!-- 方式二：路由规则中开启 props 传参 -->
    通过开启 props 获取：{{ id }}
  </div>
</template>
<script>
export default {
  name: 'Detail',
  props: ['id']
}
</script>
<style>
</style>
```



#### 嵌套路由

对路由规则 routes

```js
const routes = [
  {
    name: 'login',
    path: '/login',
    component: Login
  },
  // 嵌套路由
  {
    path: '/',
    component: Layout,
    children: [
      {
        name: 'index',
        path: '',
        component: Index
      },
      {
        name: 'detail',
        path: 'detail/:id',
        props: true,
        component: () => import('@/views/Detail.vue')
      }
    ]
  }
]
```



#### 编程式导航

```js
export default {
  name: 'Login',
  methods: {
    push () {
      this.$router.push('/')
      // this.$router.push({ name: 'Home' })
    },
    replace () {
      this.$router.replace('/login') // 不会记录历史，会用 login 替代当前
    },
    goDetail () {
      this.$router.push({ name: 'Detail', params: { id: 1 } })
    },
    go () {
      this.$router.go(-2)
      // this.$router.go(-1) 相当于 this.$router.back() 后退到上一次访问的页面
    }
  }
}
```



#### Hash 和 History 模式区别

- 表现形式的区别
  - Hash 模式
    - Https://music.163.com/#/playlist?id=3102961863
  - History 模式
    - Https://music.163.com/playlist/3102961863
- 原理的区别
  - Hash 模式是基于锚点，以及 onhashchange 事件
  - History 模式是基于 HTML5 中的 History API，HTML5 以前用到的 API 是 history.push() 会发送请求
    - history.pushState() IE10 以后才支持，如果要对 IE9 做兼容，应该使用 hash 模式
    - history.replaceState()



#### History 模式的使用

- History 需要服务器的支持
- 单页应用中，服务端不存在 http://www.testurl.com/login 这样的地址会返回找不到该页面
- 在服务端应该除了静态资源外都返回单页应用的 index.html



##### History 模式在 NodeJS 服务器上的配置

```js
// express app.js
const path = require('path')
// 导入处理 history 模式的模块
const history = require('connect-history-api-fallback')
// 导入 express
const express = require('express')

const app = express()
// 注册处理 history 模式的中间件
app.use(history())
// 处理静态资源的中间件，网站根目录 ../web
app.use(express.static(path.join(__dirname, '../web')))

// 开启服务器，端口 3000
app.listen(3000, () => {
  console.log('服务器开启，端口 3000')
})
```



##### History 模式在 Nginx 上的配置

```shell
# 在 nginx 所在目录下
# 启动
start nginx
# 重启
nginx -s reload
# 停止
nginx -s stop
```



修改 Nginx 配置文件 nginx.conf

```
server {
	location / {
		root html;
		index index.html index.htm;
		try_files $uri $uri/ /index.html;
	}
}
```





#### VueRouter 实现原理

##### 前置知识

- 插件
- 混入
- Vue.observable()
- 插槽
- render 函数
- 运行时和完整版的 Vue

##### 需求

- hash 模式
  - URL 中 # 后面的内容作为路径地址
  - 监听 hashchange 事件
  - 根据当前路由地址找到对应组件重新渲染
- history 模式
  - 通过 history.pushState() 方法改变地址栏
  - 监听 popstate 事件
  - 根据当前路由地址找到对应组件重新渲染



##### 模拟实现

类图

| VueRouter                                                    |
| :----------------------------------------------------------- |
| + options<br />+ data<br />+ routeMap                        |
| + Constructor(Options): VueRouter<br />_ install(Vue): void<br />+ init(): void<br />+ initEvent(): void<br />+ createRouteMap(): void<br />+ initComponents(Vue): void |

###### install

```js
// vuerouter/index.js
let _Vue = null

export default class VueRouter {
	static install (Vue) {
    // 1. 判断当前插件是否已经被安装
    if (VueRouter.install.installed) {
      return
    }
    VueRouter.install.installed = true
    // 2. 把 Vue 构造函数记录到全局变量
    _Vue = Vue
    // 3. 把创建 Vue 实例时传入的 router 对象注入到 Vue 实例上
    
    // 混入
    _Vue.mixin({
      beforeCreate () {
        if (this.$options.router) { // 区分组件和 Vue 实例，只向实例混入 router
          _Vue.protptype.$router = this.$options.router
        }
      }
    })
  }
}
```

###### 构造函数

```js
export default class VueRouter {
  constructor (options) {
    this.options = options
    this.routeMap = {} // 用于解析 options 中的 routes 对象，routeMap 键为路由地址，值为路由组件
    this.data = _Vue.observable({
      current: '/'
    })
  }
}
```

###### createRouteMap

```js
export default class VueRouter {
  createRouteMap () {
    // 遍历路由规则并解析成键值对，存储到 routeMap 中
    this.options.routes.forEach(route => {
      this.routeMap[route.path] = route.component
    })
  }
}
```

###### initComponents

```js
export default class VueRouter {
  initComponents (Vue) {
    Vue.component('router-link', {
      props: {
        to: String
      },
      template: '<a :href="to"><slot></slot></a>'
    })
  }
}
```

合并上述

```js
let _Vue = null

export default class VueRouter {
  static install (Vue) {
    if (VueRouter.install.installed) {
      return
    }
    VueRouter.install.installed = true
    
    _Vue = Vue
    
    _Vue.mixin({
      beforeCreate () {
        if (this.$options.router) {
          _Vue.prototype.$router = this.$options.router
          this.$options.router.init()
        }
      }
    })
  }
  
  constructor (options) {
    this.options = options
    this.routeMap = {}
    this.data = _Vue.observable({
      current: '/'
    })
  }
  
  init () {
    this.createRouteMap()
    this.initComponents()
  }
  
  createRouteMap () {
    this.options.routes.forEach(route => {
      this.routeMap[route.path] = route.component
    })
  }
  
  initComponents (Vue) {
    Vue.component('router-link', {
      props: {
        to: String
      },
      template: '<a :href="to"><slot></slot></a>'
    })
  }
}
```

###### Vue 的构建版本

- 运行时版本：不支持 template 模板，需要打包时提前编译
- 完整版本：包含运行时和编译器，体积比运行时版本大10K左右，程序运行的时候把模板转换成 render 函数

vue-cli 创建的项目默认使用运行时版本的 vue，如果需要调试上述代码，需要切换成完整版本的 vue

```js
// 项目根目录下 vue.config.js
module.exports = {
  runtimeCompiler: true
}
```

如果不想使用完整版本，则需要将 template 模板转换成通过 render 函数渲染

```js
Vue.component('router-link', {
  props: {
    to: String
  },
  render (h) {
    return h('a', {
      attrs: {
        href: this.to
      }
    }, [this.$slots.default])
    // template: '<a :href="to"><slot></slot</a>'
  }
})
```

###### router-view

```js
const self = this
Vue.component('router-view', {
  render (h) {
    const component = self.routeMap[self.data.current]
    return h(component)
  }
})
```

router-link 中 a 标签的默认跳转需要重写

```js
Vue.component('router-link', {
  props: {
    to: String
  },
  render (h) {
    return h('a', {
      attrs: {
        href: this.to
      },
      on: {
        click: this.clickHandler
      }
    }, [ this.$slots.default ])
  },
  methods: {
    clickHandler (e) {
      // 改变地址栏
      history.pushState({}, '', this.to)
      // 加载路由组件
      this.$router.data.current = this.to
      // data 是响应式的，改变 current 会自动加载对应路由组件
      e.preventDefault()
    }
  }
})
```

###### initEvent

点击浏览器前进、后退，地址栏地址发生改变时，对应的路由组件却没有切换

```js
initEvent () {
  window.addEventListener('popstate', () => {
    this.data.current = window.location.pathname
  })
}

// 同时还需要在 init 方法中调用 initEvent 方法
init () {
  this.createRouteMap()
  this.initComponents()
  this.initEvent()
}
```

至此，最终模拟的 router 代码为

```js
let _Vue = null

export default class VueRouter {
  static install (Vue) {
    if (VueRouter.install.installed) {
      return
    }
    VueRouter.install.installed = true
    
    _Vue = Vue
    
    _Vue.mixin({
      beforeCreate () {
        if (this.$options.router) {
          _Vue.prototype.$router = this.$options.router
          this.$options.router.init()
        }
      }
    })
  }
  
  constructor (options) {
    this.options = options
    this.routeMap = {}
    this.data = _Vue.observable({
      current: '/'
    })
  }
  
  init () {
    this.createRouteMap()
    this.initComponents()
    this.initEvent()
  }
  
  createRouteMap () {
    this.options.routes.forEach(route => {
      this.routeMap[route.path] = route.component
    })
  }
  
  initComponents (Vue) {
    Vue.components('router-link', {
      props: {
        to: String
      },
      render (h) {
        return h('a', {
					attrs: {
            href: this.to
          },
          on: {
            click: this.clickHandler
          }
        }, [ this.$slots.default ])
      },
      methods: {
        clickHandler (e) {
          history.pushState ({}, '', this.to)
          this.$router.data.current = this.to
          e.preventDefault()
        }
      }
    })
    
    const self = this
    Vue.component('router-view', {
      render (h) {
        const component = self.routeMap[self.data.current]
        return h(component)
      }
    })
  }
  
  initEvent () {
    window.addEventListener('popstate', () => {
      this.data.current = window.location.pathname
    })
  }
}
```

