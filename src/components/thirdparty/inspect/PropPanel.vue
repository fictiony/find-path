<template>
  <div class="fit no-scroll column">
    <q-item dense class="_header full-width">
      <q-item-section style="max-width: 24px">
        <q-btn flat dense size="sm" class="text-primary" :icon="inspect.selecting ? 'my_location' : 'location_searching'" @click="selectClick">
          <q-tooltip ref="selectTip">选择要查看的 Vue 组件</q-tooltip>
        </q-btn>
      </q-item-section>
      <q-item-section class="_toolbtn">
        <q-item-label class="text-grey-6" :lines="1">
          <span v-if="showName">{{ showName }}</span>
          <span v-else>当前未选中任何组件</span>
        </q-item-label>
      </q-item-section>
      <q-item-section side class="_toolbtn" v-if="component">
        <q-btn flat dense size="sm" class="text-primary" :icon="filterProps ? 'text_rotation_none' : 'filter_alt'" @click="filterPropsClick">
          <q-tooltip ref="filterPropsTip">{{ filterProps ? '显示所有属性' : '仅显示有值的属性' }}</q-tooltip>
        </q-btn>
      </q-item-section>
      <q-item-section side class="_toolbtn" v-if="component">
        <q-btn flat dense size="sm" class="text-primary" :icon="showOthers ? 'view_list' : 'api'" @click="showOthersClick">
          <q-tooltip ref="showOthersTip">{{ showOthers ? '显示属性列表' : '显示其他接口列表' }}</q-tooltip>
        </q-btn>
      </q-item-section>
      <q-item-section side class="_toolbtn" v-if="apiDoc">
        <q-btn flat dense size="sm" class="text-primary" icon="menu_book" type="a" target="_blank" :href="apiDoc">
          <q-tooltip>查看 API 文档</q-tooltip>
        </q-btn>
      </q-item-section>
      <q-item-section side class="_toolbtn" v-if="superName && superDoc">
        <q-btn flat dense size="sm" class="text-primary" icon="menu_book" type="a" target="_blank" :href="superDoc">
          <q-tooltip>查看基类 {{ superName }} 的 API 文档</q-tooltip>
        </q-btn>
      </q-item-section>
      <q-item-section side class="_toolbtn" v-if="!inspect.hideClose">
        <q-btn flat dense size="sm" icon="close" @click="close" />
      </q-item-section>
    </q-item>

    <CustomScroller class="_proplist full-width q-space">
      <q-markup-table flat bordered dense v-if="component && !showOthers">
        <thead>
          <tr style="height: 25px">
            <th class="_prop bg-primary text-white">属性名</th>
            <th class="_value bg-blue-grey-5 text-white">属性值</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="filteredPropList.length">
            <PropItem v-for="prop in filteredPropList" :key="prop.name" v-bind="prop" />
          </template>
          <tr v-else>
            <td colspan="2" class="text-grey-5 text-center">没有可用属性</td>
          </tr>
        </tbody>
      </q-markup-table>
      <q-markup-table flat bordered dense v-else>
        <thead>
          <tr style="height: 25px">
            <th class="_prop bg-primary text-white">类别</th>
            <th class="_value bg-blue-grey-5 text-white">接口名</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="otherApiList.length">
            <OtherApiItem v-for="apiOther in otherApiList" :key="apiOther.label" v-bind="apiOther" />
          </template>
          <tr v-else>
            <td colspan="2" class="text-grey-5 text-center">没有其他接口</td>
          </tr>
        </tbody>
      </q-markup-table>
    </CustomScroller>
  </div>
</template>

<script>
// 【属性栏】
import Vue from 'vue'
import { debounce } from 'quasar'
import { inspect, ComponentSelector } from './index'
import CustomScroller from './CustomScroller'
import PropItem from './PropItem'
import OtherApiItem from './OtherApiItem'

const CATEGORIES = ['injection', 'props', 'events', 'methods', 'slots', 'scopedSlots', 'value', 'arg', 'modifiers', 'quasarConfOptions']
const NAME_SUFFIX = {
  component: ' 组件',
  directive: ' 指令',
  plugin: ' 插件'
}

export default {
  name: 'PropPanel',

  components: {
    CustomScroller,
    PropItem,
    OtherApiItem
  },

  data: () => ({
    inspect,
    component: '',
    showName: '',
    apiDoc: '',
    superName: '',
    superDoc: '',
    propList: [],
    filterProps: false,
    otherApiList: [],
    showOthers: false
  }),

  computed: {
    filteredPropList() {
      return this.filterProps ? this.propList.filter(i => i.value !== undefined) : this.propList
    }
  },

  watch: {
    'inspect.selecting'(val) {
      if (val && !inspect.selector && inspect.selectorHolder) {
        // 自动创建组件选择器
        const holder = document.querySelector(inspect.selectorHolder)
        if (!holder) return
        const el = document.createElement('div')
        holder.appendChild(el)
        new Vue(ComponentSelector).$mount(el)
      }
    },

    'inspect.target': {
      handler: async function (val) {
        if (window) {
          window.$c = val // 方便在浏览器内调试
        }
        this.unwatchProps()

        if (val) {
          let api, superApi
          if (val.$options) {
            this.component = this.$getName(val.$options)
            this.showName = this.component + NAME_SUFFIX.component
            this.superName = (val.$options.extends && this.$getName(val.$options.extends.options)) || ''
            if (this.superName === this.component) this.superName = ''
            api = this.component ? await this.loadApi(this.component) : {}
            superApi = this.superName ? await this.loadApi(this.superName) : {}
            this.propList = this.makePropList(val, api.props, superApi.props)
          } else {
            this.component = ''
            this.showName = val.className + (NAME_SUFFIX[val.category] || NAME_SUFFIX.component)
            this.superName = val.extends || ''
            api = val.className ? await this.loadApi(val.className) : {}
            superApi = this.superName ? await this.loadApi(this.superName) : {}
            this.propList = []
          }
          this.apiDoc = inspect.getDocUrl ? inspect.getDocUrl(this.component || val.className) || '' : ''
          this.superDoc = inspect.getDocUrl ? inspect.getDocUrl(this.superName) || '' : ''
          this.otherApiList = Object.freeze(CATEGORIES.flatMap(i => this.makeOtherApiList(i, api[i], superApi[i])))
        } else {
          this.component = ''
          this.showName = ''
          this.apiDoc = ''
          this.superName = ''
          this.superDoc = ''
          this.propList = []
          this.otherApiList = []
        }
      },
      immediate: true
    }
  },

  methods: {
    // 选择组件按钮点击
    selectClick() {
      this.$refs.selectTip.hide() // 解决按钮重绘时，QTooltip无法自动消失的bug
      inspect.selecting = !inspect.selecting
    },

    // 筛选属性按钮点击
    filterPropsClick() {
      this.$refs.filterPropsTip.hide()
      this.filterProps = !this.filterProps
    },

    // 显示其他接口按钮点击
    showOthersClick() {
      this.$refs.showOthersTip.hide()
      this.showOthers = !this.showOthers
    },

    // 关闭
    close() {
      inspect.selecting = false
      inspect.target = null
      this.$emit('close')
    },

    // 生成属性列表
    makePropList(instance, props, superProps) {
      return Object.keys(instance.$props || {})
        .map(name => {
          const apiProp = (props && props[name]) || (superProps && superProps[name])
          return this.makePropInfo(instance, name, apiProp)
        })
        .sort((a, b) => {
          if (a.isNew !== b.isNew) return a.isNew ? -1 : 1
          if (a.isUpdate !== b.isUpdate) return a.isUpdate ? -1 : 1
          return a.name < b.name ? -1 : 1
        })
    },

    // 生成一条属性信息
    makePropInfo(instance, name, apiProp) {
      if (typeof apiProp !== 'object') {
        apiProp = { desc: apiProp }
      }
      const prop = (instance.$options.props && instance.$options.props[name]) || {}
      const superOptions = instance.$options.extends && instance.$options.extends.options
      const superProp = superOptions && superOptions.props && superOptions.props[name]
      const extendProps = instance.constructor.extendOptions.props
      if (prop.required && !apiProp.required) {
        apiProp.required = true
      }
      const defVal = this.getPropDefault(prop, instance)
      const description = this.getDescription(apiProp)
      const propInfo = {
        instance,
        name,
        api: Object.freeze(apiProp),
        value: name in instance.$options.propsData || instance[name] !== defVal ? instance[name] : undefined,
        type: this.getPropType(prop.type, apiProp),
        editType: apiProp.editType || this.getEditType(prop.type),
        validator: prop.validator,
        default: defVal,
        defaultDesc: apiProp.default !== undefined ? String(apiProp.default) : undefined,
        description,
        isNew: !!(superOptions && !superProp),
        isUpdate: !!(superProp && extendProps && extendProps[name]),
        unwatch: instance.$watch(
          name,
          debounce(val => {
            propInfo.value = val
          }, 100),
          { deep: true }
        )
      }
      return propInfo
    },

    // 取消属性监视
    unwatchProps() {
      this.propList.forEach(prop => prop.unwatch())
    },

    // 生成其他接口列表
    makeOtherApiList(category, api, superApi) {
      if (category === 'props' && this.component) {
        return [] // 组件属性不显示在其他接口里
      }
      return Object.keys({ ...api, ...superApi })
        .map(name => {
          const apiOther = (api && api[name]) || (superApi && superApi[name])
          return this.makeOtherApiInfo(name, category, apiOther)
        })
        .sortBy('name')
    },

    // 生成一条其他接口信息
    makeOtherApiInfo(name, category, apiOther) {
      if (typeof apiOther !== 'object') {
        apiOther = { desc: apiOther }
      }
      const description = this.getDescription(apiOther, category, name)
      return Object.freeze({
        name,
        api: Object.freeze(apiOther),
        category,
        type: this.getPropType(null, apiOther),
        defaultDesc: apiOther.default !== undefined ? String(apiOther.default) : undefined,
        description
      })
    },

    // 获取属性类型
    getPropType(type, apiProp) {
      if (type instanceof Array) return type.map(i => i.name).join(' | ')
      if (type) return type.name
      if (apiProp.type instanceof Array) return apiProp.type.join(' | ')
      return apiProp.type
    },

    // 获取编辑类型
    getEditType(type) {
      if (type instanceof Array) {
        if (type.includes(Boolean)) return 'Boolean'
        if (type.includes(Number)) return 'Number'
        if (type.includes(String)) return 'String'
        return type[0].name
      }
      return type ? type.name : ''
    },

    // 获取属性默认值
    getPropDefault(prop, instance) {
      let defVal = prop.default
      if (defVal instanceof Function && !(prop.type instanceof Array ? prop.type : [prop.type]).includes(Function)) {
        defVal = defVal.call(instance)
      }
      if (defVal !== undefined) return defVal
      if (prop.type === Boolean) {
        return false
      }
      return defVal
    },

    // 获取接口说明
    getDescription(apiItem, category, name) {
      if (apiItem.combinedDesc === undefined) {
        const lines = [apiItem.desc || '', '']
        switch (category) {
          case 'methods':
            lines.push('**调用格式**：' + name + this.makeFunctionDesc(apiItem, 0, true))
            break
          case 'events':
            lines.push('**回调格式**：function' + this.makeFunctionDesc(apiItem, 0, true))
            break
          case 'scopedSlots':
            lines.push('**作用域参数**：\n' + this.makeObjectDesc(apiItem.scope))
            break
          default:
            this.appendDetails(apiItem, lines, 0, true)
        }
        lines.push('')
        if (apiItem.addedIn) {
          lines.push(`🆕 *${apiItem.addedIn}* 版新增`)
        }
        if (apiItem.required) {
          lines.push('⚠️ 必需提供')
        }
        if (apiItem.sync) {
          lines.push('⚠️ 需使用 `.sync` 修饰符来绑定')
        }
        apiItem.combinedDesc = lines.join('\n').trim() || (this.apiDoc ? '参见 API 文档' : this.superDoc ? '参见基类 API 文档' : '')
      }
      return apiItem.combinedDesc
    },

    // 生成参数说明
    makeParamDesc(name, apiParam, level = 0) {
      const indent = '  '.repeat(level) + '- '
      const type = apiParam.type ? `(${apiParam.type instanceof Array ? apiParam.type.join(' | ') : apiParam.type}) ` : ''
      const lines = [`${indent}${name} - ${type}${apiParam.desc || ''}${apiParam.required ? ' [必填]' : ''}`]
      this.appendDetails(apiParam, lines, level + 1)
      return lines.join('\n')
    },

    // 添加单项详细信息
    appendDetails(apiItem, lines, level = 0, ignoreDefault = false) {
      if (apiItem.type === 'Function') {
        lines.push('**函数格式**：' + this.makeFunctionDesc(apiItem, level))
      }
      if (apiItem.definition) {
        lines.push('**对象结构**：\n' + this.makeObjectDesc(apiItem.definition, level))
      }
      if (apiItem.values) {
        lines.push('**可取值**：' + apiItem.values.join(' &nbsp; '))
      }
      if (!ignoreDefault && apiItem.default !== undefined) {
        lines.push('**默认值**：' + String(apiItem.default))
      }
    },

    // 生成对象说明
    makeObjectDesc(apiObj, level = 0) {
      return Object.keys(apiObj)
        .map(name => this.makeParamDesc('`' + name + '`', apiObj[name], level))
        .join('\n')
    },

    // 生成函数说明
    makeFunctionDesc(apiFunc, level = 0, noReturn = false) {
      const params = apiFunc.params ? Object.keys(apiFunc.params) : []
      const n = params.findIndex(name => !apiFunc.params[name].required)
      const paramsStr = n > 0 ? params.slice(0, n).join(', ') + '[' + (n > 0 ? ', ' : ' ') + params.slice(n).join(', ') + ' ]' : params.join(', ')
      const returns = (apiFunc.returns && apiFunc.returns.type) || 'void'
      const lines = [
        `(${paramsStr})${apiFunc.returns || !noReturn ? ' => ' + returns : ''}`,
        ...params.map(name => this.makeParamDesc('`@' + name + '`', apiFunc.params[name], level))
      ]
      if (apiFunc.returns) {
        lines.push(this.makeParamDesc('`@return`', apiFunc.returns, level))
      }
      return lines.join('\n')
    },

    // 加载API文档
    async loadApi(className) {
      if (!inspect.apiCache[className]) {
        const file = inspect.extraApi[className] || import('quasar/dist/api/' + className + '.json')
        let api
        try {
          api = this.$clone((await file).default)
          CATEGORIES.forEach(category => {
            let info = api[category]
            if (!info) return
            switch (category) {
              case 'props': {
                const props = {}
                Object.keys(info).forEach(name => {
                  props[this.$toCamelCase(name)] = info[name] // 将中划线命名统一改成驼峰命名
                })
                info = props
                break
              }
              case 'injection':
                info = {
                  [info]: {}
                }
                break
              case 'quasarConfOptions':
              case 'value':
              case 'arg': {
                if (category === 'quasarConfOptions') {
                  info.desc = [
                    '```js',
                    '// quasar.conf.js',
                    'return {',
                    '  framework: {',
                    '    config: {',
                    `      ${info.propName}: { 详见下方说明 }`,
                    '    }',
                    '  }',
                    '}',
                    '```'
                  ].join('\n')
                } else {
                  info.directive = 'v-' + this.$toKebabCase(className)
                }
                info = {
                  [info.propName || '']: info
                }
                break
              }
            }
            api[category] = info
          })
        } catch (e) {
          // console.log(e)
          api = {}
        }
        inspect.apiCache[className] = Object.freeze(api)
      }
      return inspect.apiCache[className]
    }
  },

  mounted() {
    inspect.propPanel = this
  },

  beforeDestroy() {
    this.unwatchProps()
    inspect.selecting = false
    inspect.target = null
    inspect.propPanel = null
  }
}
</script>

<style lang="scss" scoped>
._header {
  padding: 8px 8px 0px 10px;
}
._toolbtn {
  padding-left: 0px;
  margin-left: 4px;
}
._proplist {
  padding: 4px 8px 6px 8px;
  th._prop,
  th._value {
    padding: 2px 0 0 0 !important;
  }
  th._prop,
  tbody ::v-deep ._prop {
    width: 30%;
    min-width: 80px;
    max-width: 160px;
    padding: 0px 8px 0px 12px;
  }
  th._value,
  tbody ::v-deep ._value {
    min-width: 60px;
    max-width: 1px; // 能使最后一列填满剩余宽度的神奇设置
    padding: 0px 8px;
  }
}
</style>
