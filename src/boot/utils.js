import Vue from 'vue'
import { mapState, mapMutations } from 'vuex'
import axios from 'axios'
import {
  extend,
  Notify,
  Dialog,
  LocalStorage,
  AppFullscreen,
  copyToClipboard
} from 'quasar'
import CustomDialog from 'components/custom/CustomDialog.vue'
import cfg from '../../package.json'

// ----------------------------------------------------------------------------【通用】
const arrayProto = Array.prototype

// 随机生成范围内的整数
// - @max 最大值
// - @min 最小值
// - @return [min, max]范围内的随机整数（min和max大小可互换）
export function randint (max, min = 0) {
  if (max < min) [max, min] = [min, max]
  return min + Math.floor((max - min + 1) * Math.random())
}
Vue.prototype.$randint = randint

// 判断给定值是否为对象（不含null）
export function isObject (val) {
  return typeof val === 'object' && val !== null
}
Vue.prototype.$isObject = isObject

// 判断对象是否为空（含null，非对象也视作空）
export function isEmpty (obj) {
  if (!isObject(obj)) return true
  for (const i in obj) {
    if (i !== undefined) return false
  }
  return true
}
Vue.prototype.$isEmpty = isEmpty

// 克隆对象
export function clone (obj) {
  return extend(true, {}, { obj }).obj
}
Vue.prototype.$clone = clone

// 比较两个对象的差异
// - @return [a有b无的键值表, b有a无的键值表]
export function compareObjects (a, b) {
  const onlyInA = {}
  const onlyInB = {}
  Object.keys(a).forEach(k => {
    if (k in b) return
    onlyInA[k] = a[k]
  })
  Object.keys(b).forEach(k => {
    if (k in a) return
    onlyInB[k] = b[k]
  })
  return [onlyInA, onlyInB]
}
Vue.prototype.$compareObjects = compareObjects

// 序数迭代
// - @a 起始序数
// - @b 结束序数
// - @handler 迭代处理函数
// - @obj 迭代对象（可选）
// - @return 迭代对象
export function iter (a, b, handler, obj) {
  if (a < b) {
    for (let i = a; i <= b; i++) {
      handler(i, obj)
    }
  } else {
    for (let i = a; i >= b; i--) {
      handler(i, obj)
    }
  }
  return obj
}
Vue.prototype.$iter = iter

// 创建映射对象
// - @obj 给定对象
// - @valueFunc 属性值映射函数：(属性值, 属性名, 对象) => 新属性值，未指定表示属性值不变
// - @propFunc 属性名映射函数：(属性名, 对象) => 新属性名，未指定表示属性名不变
export function mapObject (obj, valueFunc, propFunc) {
  return Object.fromEntries(
    Object.keys(obj).map(i => [
      propFunc ? propFunc(i, obj) : i,
      valueFunc ? valueFunc(obj[i], i, obj) : obj[i]
    ])
  )
}
Vue.prototype.$mapObject = mapObject

// 对象数组转映射表
// - @keyName 要用作键的属性名（null表示数据项本身）
// - @value 若指定，则用作键值（若为函数，则格式为：(数据项, 序号) => 键值），否则键值为数据项本身
export function arrToMap (arr, keyName = 'id', value) {
  const map = {}
  const hasValue = arguments.length > 2
  const isFunc = value instanceof Function
  arr.forEach((item, index) => {
    const key = keyName != null ? item[keyName] : item
    if (hasValue) {
      item = isFunc ? value(item, index) : value
    }
    map[key] = item
  })
  return map
}
Object.defineProperty(arrayProto, 'toMap', {
  value: function () {
    return arrToMap(this, ...arguments)
  }
})

// 对象数组排序
// - @keyName 要用作排序值的属性名
// - @desc 是否倒序
export function arrSortBy (arr, keyName = 'id', desc = false) {
  return arr.sort((a, b) => {
    const va = a[keyName]
    const vb = b[keyName]
    return va > vb ? (desc ? -1 : 1) : va < vb ? (desc ? 1 : -1) : 0
  })
}
Object.defineProperty(arrayProto, 'sortBy', {
  value: function () {
    return arrSortBy(this, ...arguments)
  }
})

// 生成数组序号列表
export function arrIndices (arr) {
  return arr.map((_, i) => i)
}
Object.defineProperty(arrayProto, 'indices', {
  value: function () {
    return arrIndices(this)
  }
})

// 转换跨域转发代理地址
export function proxyUrl (url) {
  return url.replace(/^(https?):\/\//, '/$1/')
}
Vue.prototype.$proxyUrl = proxyUrl

// 加载Json文件
// - @url Json文件地址
// - @return Json数据对象
export async function loadJson (url) {
  const url2 = proxyUrl(url)
  let data
  if (url2 !== url) {
    const res = await axios.get(process.env.PROD ? url : url2) // 发布版不使用代理
    data = res.data
  } else {
    data = await utilPost('loadFile', url)
  }
  return typeof data === 'object' ? data : JSON.parse(data)
}
Vue.prototype.$loadJson = loadJson

// 格式化时间
// - @time 时间（单位：秒）
// - @return m:ss格式的时间
export function formatTime (time) {
  const minutes = Math.floor(time / 60)
  const seconds = time % 60
  return `${minutes}:${seconds < 10 ? 0 : ''}${seconds}`
}
Vue.prototype.$formatTime = formatTime

// 格式化Lua数据
const VAR_FORMAT = /^[a-zA-Z_]\w*$/
export function formatLua (obj) {
  switch (typeof obj) {
    case 'string':
    case 'number':
    case 'boolean':
      return JSON.stringify(obj)
    case 'object':
      if (obj === null) return 'nil'
      if (obj instanceof Array) {
        obj = obj.map(formatLua)
      } else {
        obj = Object.keys(obj).map(i => {
          const field = VAR_FORMAT.test(i) ? i : '[' + JSON.stringify(i) + ']'
          return field + '=' + formatLua(obj[i])
        })
      }
      return '{' + obj.join(',') + '}'
    default:
      return 'nil' // 其他类型都视作nil
  }
}
Vue.prototype.$formatLua = formatLua

// 格式化CSV数据
// - @items 数据项列表
// - @fields 字段名列表（若未指定，则直接取每项数据的values作为字段值列表）
const CSV_CHARS = /"|'|,|\s/
export function formatCsv (items, fields) {
  const lines = items.map(item => {
    let values = fields ? fields.map(i => item[i]) : Object.values(item)
    values = values.map(val => {
      if (val == null) return ''
      val = String(val)
      return val.match(CSV_CHARS) ? JSON.stringify(val) : val
    })
    return values.join(',')
  })
  return lines.join('\n')
}
Vue.prototype.$formatCsv = formatCsv

// HTML编码
export function htmlEncode (text) {
  const temp = document.createElement('div')
  if (temp.textContent === undefined) {
    temp.innerText = text
  } else {
    temp.textContent = text
  }
  return temp.innerHTML
}
Vue.prototype.$htmlEncode = htmlEncode

// HTML解码
export function htmlDecode (html) {
  const temp = document.createElement('div')
  temp.innerHTML = html
  return temp.textContent === undefined ? temp.innerText : temp.textContent
}
Vue.prototype.$htmlDecode = htmlDecode

// 创建CSS的transform样式
// - @scale 缩放比率（原大为1）
// - @rotate 旋转角度
// - @pivot 中心点位置：[X偏移率, Y偏移率]（左上角为[0,0]，右下角为[1,1]）
export function makeTransform (scale = 1, rotate = 0, pivot = [0, 0]) {
  const transform = []
  if (pivot[0] || pivot[1]) {
    transform.push(`translate(${-100 * pivot[0]}%, ${-100 * pivot[1]}%)`) // 必须放前面，否则偏移量会受缩放影响
  }
  if (scale !== 1) {
    transform.push(`scale(${scale})`)
  }
  if (rotate) {
    transform.push(`rotate(${-rotate}deg)`)
  }
  return transform.join(' ')
}
Vue.prototype.$makeTransform = makeTransform

// 将DOM元素移到最上层
// - @el 指定DOM元素
export function bringToFront (el) {
  const parent = el.parentElement
  if (!parent || el === parent.lastElementChild) return
  parent.removeChild(el)
  parent.appendChild(el)
}
Vue.prototype.$bringToFront = function () {
  bringToFront(this.$el)
}

// 清除当前焦点
export function clearFocus () {
  document.activeElement && document.activeElement.blur()
}
Vue.prototype.$clearFocus = clearFocus

// 设置全局鼠标光标
export function setCursor (cursor = '') {
  document.documentElement.style.cursor = cursor
}
Vue.prototype.$setCursor = setCursor

// 校验条件，不满足就抛出异常
export function assert (condition, error = '未知错误') {
  if (condition) return
  throw error instanceof Error ? error : Error(error)
}
Vue.prototype.$assert = assert

// 异步等待
// - @delay 要等待的时间（毫秒）
export function sleep (delay = 0) {
  return new Promise(resolve => {
    setTimeout(resolve, delay)
  })
}
Vue.prototype.$sleep = sleep

// 工作线程中介
const workerAgent = String(() => {
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor
  self.onmessage = async function (e) {
    try {
      const [code, notify, args] = e.data
      self.notify = (...args) => notify && postMessage(['notify', args])
      const result = await AsyncFunction(code)(...args)
      postMessage(['return', result])
    } catch (err) {
      postMessage(['throw', err])
    }
  }
  postMessage(['ready'])
})
const workerAgentScript = workerAgent.substring(
  workerAgent.indexOf('{') + 1,
  workerAgent.lastIndexOf('}')
)
const workerAgentUrl = URL.createObjectURL(
  new Blob([workerAgentScript], { type: 'text/javascript' })
)

// 在工作线程中运行代码
// - @code 要运行的代码（可为文本或异步import句柄）或函数（无参数），代码中可使用await和return
// - @notify 运行过程中的通知接收函数（可选，可为async），格式为：(...) => 是否中止运行，在代码中可通过self.notify(...)来发送通知
// - @...args 要传递给代码的参数（由于发布时代码会被混淆，因此代码中要获取传入的参数不能用形参，而应使用arguments）
// 注：由于代码以函数体形式在独立的工作线程中运行，因此代码中不能使用import语句和外部函数（可改为在代码中重新定义要用到的工具函数）
// 若代码是通过import引入外部文件的，为避免webpack发布报错，以及导出其他模块可复用的函数，故增加以下特殊规则：
//   1) 以纯文本模式import（即import路径加!raw-loader!前缀）时，代码格式虽无要求，但发布时代码将无法混淆，且无法导出函数
//   2) 以js模块import时，需将代码包成一个函数并导出为default，若还想导出代码内部函数，则可通过以下技巧来实现：
//      export default function main(entry) {
//         function methodForExport1() { ... }
//         function methodForExport2() { ... }
//         ...
//         if (entry === 1) return methodForExport1
//         if (entry === 2) return methodForExport2
//         ...
//         /* 要在工作线程内运行的代码 */
//         ...
//      }
//      export const methodForExport1 = main(1)
//      export const methodForExport2 = main(2)
export function workerRun (code, notify, ...args) {
  return new Promise((resolve, reject) => {
    function run (code) {
      const worker = new Worker(workerAgentUrl)
      worker.onmessage = async e => {
        const [event, data] = e.data
        switch (event) {
          case 'ready':
            return worker.postMessage([code, !!notify, args])
          case 'return':
            worker.terminate()
            return resolve(data)
          case 'throw':
            worker.terminate()
            return reject(data)
          case 'notify': {
            if (!notify) return
            let stop = notify(...data)
            if (stop instanceof Promise) stop = await stop()
            if (!stop) return
            worker.terminate()
            return resolve()
          }
        }
      }
    }
    if (code instanceof Promise) {
      code
        .then(module => workerRun(module.default, notify, ...args))
        .then(resolve)
        .catch(reject)
    } else if (typeof code === 'function') {
      code = String(code)
      run(code.substring(code.indexOf('{') + 1, code.lastIndexOf('}')))
    } else {
      run(String(code))
    }
  })
}
Vue.prototype.$workerRun = workerRun

// ----------------------------------------------------------------------------【Vue相关】

// 用于Vuex中的commit/dispatch
export const ROOT = { root: true }

// 创建绑定Vuex状态并可更改的计算属性
// - @namespace, map 和vuex自带的mapState调用格式相同，只是增加了set函数绑定到同名的mutation
// - @afterSet Setter执行之后的处理函数或方法名（可用来额外调用一些action等等）
export function mapStateRW (namespace, map, afterSet) {
  const getters = mapState(namespace, map)
  const setters = mapMutations(namespace, map)
  const computed = {}
  Object.keys(getters).forEach(name => {
    let setter
    if (afterSet) {
      setter = function (val) {
        setters[name].call(this, val)
        if (afterSet instanceof Function) {
          afterSet.call(this, name, val)
        } else {
          this[afterSet](name, val)
        }
      }
    } else {
      setter = setters[name]
    }
    computed[name] = {
      get: getters[name],
      set: setter
    }
  })
  return computed
}

// 自动生成列表状态属性的对应映射表Getters
// - @names 列表状态属性名列表（不含后缀List，生成Getter名称后缀加Map）
// - @keyName 要用作映射键的属性名（默认为id）
// - @genIndexMap 是否同时生成序号映射表（Getter后缀为IndexMap）
// - @return 映射表Getters（后缀为Map）
export function genMapGetters (names, keyName = 'id', genIndexMap = false) {
  const getters = {}
  names.forEach(name => {
    getters[name + 'Map'] = function (state) {
      const map = state[name + 'List'].toMap(keyName)
      return Object.freeze(map)
    }
    if (genIndexMap) {
      getters[name + 'IndexMap'] = function (state) {
        const map = state[name + 'List'].toMap(keyName, (_, index) => index)
        return Object.freeze(map)
      }
    }
  })
  return getters
}

// 自动生成状态属性同名变化指令
// - @names 状态属性名列表
// - @afterSet 变化之后的处理函数（可用来额外记录一些状态）
// - @return 变化指令表
export function genMutations (names, afterSet) {
  const mutations = {}
  names.forEach(name => {
    mutations[name] = function (state, val) {
      if (val === state[name]) return
      state[name] = val
      afterSet && afterSet(name, val, state)
    }
  })
  return mutations
}

// 自动生成对象状态属性的对应变化指令
// - @names 对象状态属性名列表（生成变化指令后缀加Change）
// - @mode 更新模式：0-直接赋值（默认）/1-响应式赋值删除（值为null表示删除）/2-单独更新子属性（也为响应式）/3-整体替换（大批量修改时比2快）
// - @return 变化指令表
// 变化参数格式为：
// - @change 更新信息
export function genObjectMutations (names, mode) {
  const mutations = {}
  names.forEach(name => {
    mutations[name + 'Change'] = function (state, change) {
      const prop = state[name]
      switch (mode) {
        case 1:
        case 2:
          Object.keys(change).forEach(i => {
            const val = change[i]
            if (val == null) {
              Vue.delete(prop, i)
            } else if (mode === 2 && isObject(val) && isObject(prop[i])) {
              const obj = prop[i]
              Object.keys(val).forEach(j => {
                if (val[j] == null) {
                  Vue.delete(obj, j)
                } else {
                  Vue.set(obj, j, val[j])
                }
              })
            } else {
              Vue.set(prop, i, val)
            }
          })
          break
        case 3: {
          const t = { ...prop }
          Object.keys(change).forEach(i => {
            const val = change[i]
            if (val == null) {
              delete t[i]
            } else {
              t[i] = val
            }
          })
          state[name] = t
          break
        }
        default:
          Object.assign(prop, change)
          break
      }
    }
  })
  return mutations
}

// 自动生成列表状态属性的对应变化指令
// - @names 列表状态属性名列表（生成变化指令后缀加Change）
// - @return 变化指令表
// 变化参数格式为：
// - @index 序号
// - @item 数据项（null表示删除，更新子列表时格式为：[子列表属性名, 子列表序号, 子列表数据项, 模式]，可递归）
// - @mode 模式：0-替换（默认）/1-新增/2-更新/3-更新子列表（新增时序号不存在表示加到最后，替换或更新时序号不存在则忽略）
export function genListMutations (names) {
  const mutations = {}
  names.forEach(name => {
    mutations[name + 'Change'] = function (state, params) {
      listChange(state[name], params)
    }
  })
  return mutations
}
function listChange (list, [index, item, mode]) {
  if (item == null) {
    if (!(index in list)) return
    list.splice(index, 1)
  } else if (mode) {
    if (index in list) {
      if (mode === 1) {
        list.splice(index, 0, item)
      } else if (mode === 2) {
        Object.assign(list[index], item)
      } else {
        listChange(list[index][item[0]], item.slice(1))
      }
    } else if (mode === 1) {
      list.push(item)
    }
  } else {
    if (!(index in list)) return
    list[index] = item
  }
}

// 自动暴露子组件属性为计算属性
// - @ref 子组件引用名
// - @names 子组件属性名列表
// - @prefix 暴露属性名前缀
// - @writable 是否可写
// - @return 计算属性列表
export function exposeChildProps (ref, names, prefix = '', writable = false) {
  const computed = {}
  names.forEach(name => {
    computed[prefix + name] = function () {
      return this.$refs[ref][name]
    }
    if (writable) {
      computed[prefix + name] = {
        get: computed[prefix + name],
        set: function (val) {
          this.$refs[ref][name] = val
        }
      }
    }
  })
  return computed
}

// 自动暴露子组件方法
// - @ref 子组件引用名
// - @names 子组件方法名列表
// - @prefix 暴露方法名前缀
// - @return 方法列表
export function exposeChildMethods (ref, names, prefix = '') {
  const methods = {}
  names.forEach(name => {
    methods[prefix + name] = function (...args) {
      return this.$refs[ref][name](...args)
    }
  })
  return methods
}

// 设置对象的部分属性可响应
// - @obj 给定对象
// - @props 属性名列表
export function reactive (obj, ...props) {
  if (typeof obj !== 'object') return
  props.forEach(prop => {
    Vue.util.defineReactive(obj, prop)
  })
}
Vue.prototype.$reactive = reactive

// 根据给定属性名列表创建绑定数据对象
// - @props 属性名列表
// - @prefix 数据变量名前缀
// - @from 属性来源对象
// - @convert 属性值转换函数，格式为：(属性值, 属性名) => 转换后的属性值，null表示不变
// - @return 数据对象
export function mapProps (props, prefix = '', from = this, convert = null) {
  const data = {}
  props.forEach(name => {
    data[prefix + name] = convert ? convert(from[name], name) : from[name]
  })
  return data
}
Vue.prototype.$mapProps = mapProps

// 根据给定属性名列表将数据同步给属性
// - @props 属性名列表
// - @data 数据对象
// - @prefix 数据变量名前缀
// - @to 属性目的对象
// - @convert 属性值转换函数，格式为：(属性值, 属性名) => 转换后的属性值，null表示不变
export function syncProps (
  props,
  data,
  prefix = '',
  to = this,
  convert = null
) {
  props.forEach(name => {
    to[name] = convert
      ? convert(data[prefix + name], name)
      : data[prefix + name]
  })
}
Vue.prototype.$syncProps = syncProps

// 获取对象的嵌套属性值
// - @obj 给定对象
// - @nested 嵌套属性名（用.分隔）
// - @return 嵌套属性值
export function getNested (obj, nested) {
  const props = nested.split('.')
  for (let i = 0; i < props.length && obj !== undefined; i++) {
    obj = obj[props[i]]
  }
  return obj
}
Vue.prototype.$getNested = getNested

// ----------------------------------------------------------------------------【Quasar相关】

// 文本突显
export function B (text, color = 'red') {
  return ` <b class="text-${color}">${text}</b> `
}

// 显示通知信息
// - @message 消息内容（HTML）
// - @type 通知类型
// - @params 通知栏额外参数
export function notify (message, type = 'info', params = {}) {
  return Notify.create({
    type,
    message,
    ...params
  })
}
Vue.prototype.$notify = notify
Notify.registerType('info', {
  position: 'top',
  html: true,
  icon: 'info',
  color: 'grey-1',
  textColor: 'primary',
  timeout: 2000
})
Notify.registerType('warn', {
  position: 'top',
  html: true,
  icon: 'warning',
  color: 'red-8',
  textColor: 'white',
  timeout: 3000
})

// 显示消息框
// - @message 消息内容（组件或HTML）
// - @title 标题（HTML）
// - @params 对话框额外参数
export function showMsg (message, title = '提示', params = {}) {
  // return Dialog.create({
  //   title,
  //   message,
  //   html: true,
  //   noBackdropDismiss: true,
  //   ...params
  // })
  return showDlg(message, title, true, {
    cancelBtn: false,
    contentParams: {
      class: 'q-pa-lg',
      style: 'min-width: 300px'
    },
    ...params
  })
}
Vue.prototype.$showMsg = showMsg

// 询问框
// - @message 消息内容（HTML）
// - @title 标题（HTML）
// - @return 选是：true，选否：false，取消：null
export async function showAsk (message, title = '询问') {
  return new Promise(resolve => {
    showMsg(message, title, {
      okBtn: false,
      yesBtn: true,
      noBtn: true
    })
      .onOk(yesNo => {
        resolve(yesNo)
      })
      .onCancel(() => {
        resolve(null)
      })
  })
}
Vue.prototype.$showAsk = showAsk

// 显示对话框
// - @content 内容组件或HTML
// - @title 标题（HTML），null表示无标题栏
// - @model 是否模态对话框
// - @params 对话框额外参数
export function showDlg (content, title = null, model = true, params = {}) {
  return Dialog.create({
    title,
    component: CustomDialog,
    content,
    model,
    seamless: !model,
    persistent: !model,
    noEscDismiss: true,
    noBackdropDismiss: true,
    ...params
  })
}
Vue.prototype.$showDlg = showDlg

// ----------------------------------------------------------------------------【Electron相关】

// 主窗口事件处理
const ELECTRON = process.env.MODE === 'electron' ? require('electron') : null
if (ELECTRON) {
  ELECTRON.ipcRenderer.on('win-event', (e, type) => {
    switch (type) {
      case 'maximize':
      case 'unmaximize':
        return Vue.store.commit('main/maximized', type === 'maximize')
      case 'before-quit':
        // return Vue.store.dispatch('file/tryQuit')
        return appCall('exit')
    }
  })
}

// IPC方法调用
function ipcCall (mode, target, method, ...args) {
  if (ELECTRON) {
    switch (mode) {
      case 'call':
        return ELECTRON.ipcRenderer.send('call', target, method, ...args)
      case 'get':
        return ELECTRON.ipcRenderer.sendSync('call', target, method, ...args)
      case 'post':
        return ELECTRON.ipcRenderer.invoke('call', target, method, ...args)
    }
  } else {
    function wrapResult (val) {
      return mode === 'post' && !(val instanceof Promise)
        ? new Promise(resolve => resolve(val))
        : val
    }

    // 网页版模拟接口
    console.log(`[${target}-${mode}] ${method}:`, ...args)
    switch (method) {
      case 'quit':
        // return wrapResult(Vue.store.dispatch('file/tryQuit'))
        return wrapResult(appCall('exit'))
      case 'exit':
        return wrapResult(window.close())
      case 'maximize':
        return wrapResult(AppFullscreen.request())
      case 'unmaximize':
        return wrapResult(AppFullscreen.exit())
      case 'showOpenDialog':
        return wrapResult({
          canceled: false,
          filePaths: ['tempFile']
        })
      case 'showSaveDialog':
        return wrapResult({
          canceled: false,
          filePath: 'tempFile'
        })
      case 'loadFile':
        if (!['tempFile'].includes(args[0])) {
          return wrapResult(axios.get(...args).then(res => res.data))
        }
        return wrapResult(LocalStorage.getItem(...args))
      case 'saveFile':
        if (!['tempFile'].includes(args[0])) break
        LocalStorage.set(...args)
        return wrapResult(true)
    }

    showMsg('网页模式下不支持此功能')
    return wrapResult()
  }
}

// App方法调用
export function appCall (method, ...args) {
  ipcCall('call', 'app', method, ...args)
}
export function appGet (method, ...args) {
  return ipcCall('get', 'app', method, ...args)
}
export async function appPost (method, ...args) {
  return await ipcCall('post', 'app', method, ...args)
}
Vue.prototype.$appCall = appCall
Vue.prototype.$appGet = appGet
Vue.prototype.$appPost = appPost

// 主窗口方法调用
export function winCall (method, ...args) {
  ipcCall('call', 'win', method, ...args)
}
export function winGet (method, ...args) {
  return ipcCall('get', 'win', method, ...args)
}
export async function winPost (method, ...args) {
  return await ipcCall('post', 'win', method, ...args)
}
Vue.prototype.$winCall = winCall
Vue.prototype.$winGet = winGet
Vue.prototype.$winPost = winPost

// 对话框方法调用
export function dlgCall (method, ...args) {
  ipcCall('call', 'dlg', method, ...args)
}
export async function dlgPost (method, ...args) {
  return await ipcCall('post', 'dlg', method, ...args)
}
Vue.prototype.$dlgCall = dlgCall
Vue.prototype.$dlgPost = dlgPost

// 工具方法调用
export async function utilPost (method, ...args) {
  return await ipcCall('post', 'util', method, ...args)
}
Vue.prototype.$utilPost = utilPost

// 加载配置信息
// - @name 配置项名称（空表示获取整个配置信息）
// - @return 配置数据
const CONFIG_PATH = `../${cfg.name}.json`
let config = null
export async function loadConfig (name) {
  if (ELECTRON) {
    if (config == null) {
      try {
        config = await loadJson(CONFIG_PATH)
        assert(config && typeof config === 'object')
      } catch (e) {
        config = {}
      }
    }
    return name ? config[name] : config
  } else if (LocalStorage.has(cfg.name + '.' + name)) {
    return LocalStorage.getItem(cfg.name + '.' + name)
  } else {
    try {
      return await loadJson(name + '.json') // 默认配置数据
    } catch (e) {
      return null
    }
  }
}

// 保存配置信息
// - @name 配置项名称（空表示设置整个配置信息）
// - @data 配置数据
// - @combine 是否采用合并模式
export async function saveConfig (name, data, combine) {
  if (ELECTRON) {
    loadConfig() // 确保配置已加载
    if (combine) {
      extend(true, name ? config[name] : config, data || {})
    } else if (name) {
      config[name] = data
    } else {
      config = data || {}
    }
    await utilPost('saveFile', CONFIG_PATH, JSON.stringify(config, null, 2))
  } else {
    LocalStorage.set(cfg.name + '.' + name, data)
  }
}

// 清空所有配置信息
export async function clearConfig () {
  if (ELECTRON) {
    config = {}
    await utilPost('saveFile', CONFIG_PATH, JSON.stringify(config))
  } else {
    LocalStorage.clear()
  }
}

// 获取剪贴板文本内容
// - @matchExpr 要求满足的正则表达式（可选）
// - @return 满足条件的文本内容（无则为''）
export function getClipboardText (matchExpr) {
  if (ELECTRON) {
    const text = ELECTRON.clipboard.readText() || ''
    return !matchExpr || matchExpr.test(text) ? text : ''
  }
  return ''
}

// 设置剪贴板文本内容
export async function setClipboardText (text) {
  text = String(text)
  if (ELECTRON) {
    ELECTRON.clipboard.writeText(text)
  }
  await copyToClipboard(text)
}

// 获取剪贴板JSON对象
// - @mark 识别标记（若指定，则剪贴板内格式需以“{"mark":”开头）
// - @noParse 是否不解析成对象
// - @return 若存在，则返回对象（或未解析的JSON字符串），否则返回null
export function getClipboardJson (mark, noParse) {
  const json = getClipboardText(mark ? new RegExp(`^{"${mark}":`) : null)
  if (json) {
    if (noParse) return json
    try {
      return JSON.parse(json)[mark]
    } catch (e) {}
  }
  return null
}

// 设置剪贴板JSON对象
// - @obj 要设置的对象
// - @mark 识别标记（若指定，则将包裹在对象的JSON外面）
export async function setClipboardJson (obj, mark) {
  if (mark) {
    obj = { [mark]: obj }
  }
  await setClipboardText(JSON.stringify(obj))
}
