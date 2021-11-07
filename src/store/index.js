import Vue from 'vue'
import Vuex from 'vuex'

import main from './main'

Vue.use(Vuex)

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default function (/* { ssrContext } */) {
  const Store = new Vuex.Store({
    modules: {
      main
    },
    plugins: [], // 关闭开发模式下的state整体备份（会造成卡顿）

    // enable strict mode (adds overhead!)
    // for dev mode only
    strict: process.env.DEBUGGING
  })

  Vue.store = Store
  if (process.env.DEBUGGING) {
    window.$s = Store // 方便调试
  }
  Object.freeze(Vue.store.state) // 冻结state，以避免被加入不必要的响应式处理（会造成卡顿）
  return Store
}
