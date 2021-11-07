<template>
  <CommonInput ref="input" style="word-break: break-all" v-bind="$attrs" v-on="$listeners" :formatter="format" :validator="validate" />
</template>

<script>
// 【通用文本输入框】
import { exposeChildProps, exposeChildMethods } from 'boot/utils'

export default {
  inheritAttrs: false,

  props: {
    trim: Boolean, // 是否自动修剪首尾空白字符
    formatter: Function, // 额外的输入值格式化函数
    validator: Function // 额外的输入值校验函数
  },

  computed: {
    ...exposeChildProps('input', ['focused', 'hasRules', 'hasError'])
  },

  methods: {
    ...exposeChildMethods('input', ['blur', 'focus', 'resetValidation', 'select', 'validate']),

    // 格式化输入值
    format(val) {
      val = val == null ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val)
      return this.formatter ? this.formatter(val) : val
    },

    // 校验输入值
    validate(val) {
      if (this.trim) {
        val = val.trim()
      }
      return this.validator ? this.validator(val) : val
    }
  }
}
</script>
