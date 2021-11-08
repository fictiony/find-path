<template>
  <div class="row items-center">
    <label class="q-mr-sm" :class="labelClass" :style="combineLabelStyle" v-if="label">
      {{ label }}
      <q-tooltip max-width="400px" anchor="top left" self="top right" v-if="tips">
        <q-markdown :src="tips" v-if="mdTips" />
        <template v-else>{{ tips }}</template>
      </q-tooltip>
    </label>
    <template v-for="index in count">
      <label :key="'L' + index" class="q-mx-sm" :class="labelClass" :style="labelStyle" v-if="spacer && index &gt; 1">
        {{ spacer }}
      </label>
      <component
        :key="index - 1"
        :ref="index - 1"
        :is="itemInput"
        :value="value[index - 1]"
        :auto-save="autoSave"
        v-bind="combineParams"
        label=""
        tips=""
        v-on="{ ...$listeners, input: () => {} }"
        @input="onInput(index - 1, $event)"
      />
    </template>
    <q-btn dense flat round class="q-ml-xs text-primary" icon="chevron_left" size="sm" @click="count -= 1" v-if="showDel">
      <q-tooltip>减一项</q-tooltip>
    </q-btn>
    <q-btn dense flat round class="q-ml-xs text-primary" icon="chevron_right" size="sm" @click="count += 1" v-if="showAdd">
      <q-tooltip>加一项</q-tooltip>
    </q-btn>
  </div>
</template>

<script>
// 【通用数组】
import { INPUT, NESTED } from 'components/custom/form'

export default {
  props: {
    label: String, // 左侧文字标签
    labelClass: [String, Array, Object], // 左侧文字标签样式
    labelStyle: Object,
    labelWidth: Number, // 左侧文字标签宽度
    tips: String, // 提示说明文字
    mdTips: Boolean, // 提示是否采用Markdown格式
    item: {
      // 数组项定义，格式为：{ t: 输入框类型（参见INPUT，默认为num）, dynamicParams: 动态参数表获取函数（若指定，则需返回动态参数表）,
      // onInput: 输入事件处理函数（参数为：输入值, 输入框组件）, ...输入框组件参数 }
      type: Object,
      default: () => ({})
    },
    value: {
      // 数组数据
      type: Array,
      default: () => []
    },
    minCount: {
      // 数组最少项数，当像素大于minCount时，显示删除按钮
      type: Number,
      default: 0
    },
    maxCount: {
      // 数组最多项数（<0表示不限），当项数小于maxCount时，显示添加按钮
      type: Number,
      default: -1
    },
    spacer: String, // 数组项间的分隔文字
    inputParams: {
      // 输入框的统一参数表（其中onInput的输入值参数将自动变为：{ field: 列表项序号（嵌套时用.分隔）, value: 输入值 }）
      type: Object,
      default: () => ({})
    },
    autoSave: Boolean // 是否自动保存数组项输入值（即无需添加input事件来更新输入值到数组数据项中）
  },

  computed: {
    // 当前数组项数
    count: {
      get() {
        return this.validateCount(this.value.length)
      },
      set(val) {
        val = this.validateCount(val)
        if (this.autoSave) {
          const data = this.value
          data.length = val
        }
        this.$emit('input', { field: 'length', value: val })
      }
    },

    // 是否显示删除按钮
    showDel() {
      return this.count > Math.max(0, this.minCount)
    },

    // 是否显示添加按钮
    showAdd() {
      return this.maxCount < 0 || this.count < this.maxCount
    },

    // 合并后的左侧文字标签样式
    combineLabelStyle() {
      return this.labelWidth ? { width: this.labelWidth + 'px', ...this.labelStyle } : this.labelStyle
    },

    // 数组项类型
    itemType() {
      return this.item.t || 'num' || this.inputParams.t
    },

    // 数组项组件
    itemInput() {
      return INPUT[this.itemType] || this.itemType || INPUT.default
    },

    // 合并后的数组项参数表
    combineParams() {
      const dynamicParams = this.item.dynamicParams ? this.item.dynamicParams() : null
      return { ...this.inputParams, ...this.item, ...dynamicParams, inputParams: { ...this.inputParams, ...this.item.inputParams } }
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
    // 矫正数组项数
    // - @return 矫正到最小最大项数范围内的项数值
    validateCount(count) {
      return Math.max(Math.max(0, this.minCount), this.maxCount < 0 ? count : Math.min(this.maxCount, count))
    },

    // 获取指定数组项
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
        this.item.onInput(value, this)
      } else if (this.inputParams.onInput) {
        this.inputParams.onInput(nestedValue, this)
      }
      this.$emit('input', nestedValue)
    }
  }
}
</script>
