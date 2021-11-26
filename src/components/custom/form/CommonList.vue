<template>
  <q-card class="column" flat v-bind="$attrs">
    <div class="_header row" :class="headerClass" :style="headerStyle">
      <label :class="labelClass" :style="labelStyle" v-if="label">
        {{ label }}
        <CommonTips :tips="tips" v-if="tips" />
      </label>
      <q-space />
      <q-btn dense flat round class="text-primary _btn" icon="add_circle_outline" @click="onAdd" v-if="showAdd">
        <q-tooltip>新增</q-tooltip>
      </q-btn>
      <q-btn v-for="(btn, name) in otherBtns" :key="name" dense flat round class="text-primary _btn" v-bind="btn" @click="onOther(name)">
        <q-tooltip v-if="btn.tips">{{ btn.tips }}</q-tooltip>
      </q-btn>
    </div>
    <div
      v-for="(item, index) in value"
      :key="index"
      class="row items-center no-wrap"
      :style="getItemStyle(index)"
      @mouseover="hoverIndex = index"
      @mouseout="hoverIndex = null"
    >
      <q-badge class="q-mr-md cursor-pointer" v-bind="indexParams" @click="onSelect(index)" v-if="selectable">
        {{ index + 1 }}
      </q-badge>
      <q-badge class="q-mr-md" v-bind="indexParams" v-else>{{ index + 1 }}</q-badge>
      <component
        :ref="index"
        :is="itemInput"
        :value="item"
        :auto-save="autoSave"
        v-bind="combineParams"
        v-on="itemListeners"
        @input="onInput(index, $event)"
      />
      <q-btn
        dense
        flat
        round
        class="q-ml-xs text-primary"
        :style="hoverIndex === index ? '' : 'opacity: 0.2'"
        icon="close"
        size="sm"
        @click="onDel(index)"
        v-if="showDel"
      />
    </div>
  </q-card>
</template>

<script>
// 【通用列表】
import { INPUT, NESTED } from 'components/custom/form'
import CommonTips from './CommonTips.vue'

export default {
  components: { CommonTips },

  data: () => ({
    hoverIndex: null // 当前鼠标悬停的项序号
  }),

  props: {
    headerClass: [String, Array, Object], // 标题栏样式
    headerStyle: [String, Array, Object],
    label: String, // 标题文字
    labelClass: [String, Array, Object], // 标题文字样式
    labelStyle: [String, Array, Object],
    indexParams: Object, // 左侧序号标签参数表
    tips: [String, Array], // 提示说明文字
    item: {
      // 列表项定义，格式为：{ t: 输入框类型（参见INPUT，默认为form）, dynamicParams: 动态参数表获取函数（若指定，则需返回动态参数表）,
      // onInput: 输入事件处理函数（参数为：输入值, 输入框组件）, ...输入框组件参数 }
      type: Object,
      default: () => ({})
    },
    value: {
      // 列表数据
      type: Array,
      default: () => []
    },
    inputParams: {
      // 输入框的统一参数表（其中onInput的输入值参数将自动变为：{ field: 列表项序号（嵌套时用.分隔）, value: 输入值 }）
      type: Object,
      default: () => ({})
    },
    autoSave: Boolean, // 是否自动保存列表项输入值（即无需添加input事件来更新输入值到列表数据项中）
    showDel: Boolean, // 是否显示删除按钮
    showAdd: Boolean, // 是否显示添加按钮
    otherBtns: {
      // 其他功能按钮，格式为：{ 按钮标识名: { tips: 按钮提示, icon: 按钮图标, label: 按钮文字, ...其他按钮组件属性 } }
      type: Object,
      default: () => ({})
    },
    newItem: Function, // 新数据项生成函数（autoSave为true时有效）
    selectable: Boolean, // 列表项是否可点选
    selectedIndices: {
      // 选中项序号列表
      type: Array,
      default: () => []
    }
  },

  computed: {
    // 列表项类型
    itemType() {
      return this.item.t || 'form' || this.inputParams.t
    },

    // 列表项组件
    itemInput() {
      return INPUT[this.itemType] || this.itemType || INPUT.default
    },

    // 合并后的列表项参数表
    combineParams() {
      const dynamicParams = this.item.dynamicParams ? this.item.dynamicParams() : null
      return { ...this.inputParams, ...this.item, ...dynamicParams, inputParams: { ...this.inputParams, ...this.item.inputParams } }
    },

    // 列表项事件监听列表
    itemListeners() {
      return { ...this.$listeners, input: () => {} }
    },

    // 是否嵌套
    isNested() {
      return NESTED.includes(this.itemType)
    },

    // 判断是否有取值错误
    hasError() {
      return this.value.findIndex((_, i) => this.getItem(i).hasError) >= 0
    }
  },

  methods: {
    // 获取数据项样式
    getItemStyle(index) {
      return this.selectedIndices.includes(index) ? 'background-color: #88ff4455' : ''
    },

    // 获取指定列表项
    getItem(index) {
      return this.$refs[index][0]
    },

    // 矫正嵌套输入字段名和值
    adjustNested(index, value) {
      return this.isNested ? { field: index + '.' + value.field, value: value.value } : { field: index, value }
    },

    // 输入时处理
    onInput(index, value) {
      if (this.autoSave && !this.isNested) {
        const data = this.value // 直接赋值会报props不能直接修改的警告
        data[index] = value
      }
      const nestedValue = this.adjustNested(index, value)
      if (this.item.onInput) {
        this.item.onInput(value, this.getItem(index))
      } else if (this.inputParams.onInput) {
        this.inputParams.onInput(nestedValue, this)
      }
      this.$emit('input', nestedValue)
    },

    // 点击添加按钮
    onAdd() {
      if (this.autoSave && this.newItem) {
        const data = this.value
        data.push(this.newItem())
      }
      this.$emit('input', { field: 'add' })
    },

    // 点击删除按钮
    onDel(index) {
      if (this.autoSave) {
        const data = this.value
        data.splice(index, 1)
      }
      this.$emit('input', { field: 'del', value: index })
    },

    // 选中列表项
    onSelect(index) {
      if (this.autoSave) {
        const data = this.selectedIndices
        data.splice(0, data.length, index)
      }
      this.$emit('input', { field: 'select', value: index })
    },

    // 点击其他按钮
    onOther(name) {
      this.$emit('input', { field: name })
    }
  }
}
</script>

<style lang="scss" scoped>
._header {
  height: 24px;
}
._btn {
  margin: -6px -6px -2px 8px;
}
</style>
