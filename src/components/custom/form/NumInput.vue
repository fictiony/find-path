<template>
  <CommonInput ref="input" v-bind="$attrs" v-on="$listeners" :defVal="defVal" :formatter="format" :normalizer="normalize" :validator="validate" />
</template>

<script>
// 【通用数值输入框】
import { exposeChildProps, exposeChildMethods } from 'boot/utils'

const NUMBER_FORMAT = /^-?([1-9]\d*|0+)?(\.\d*)?$/

export default {
  inheritAttrs: false,

  props: {
    precision: {
      // 数值精度（小数位数）
      type: Number,
      default: 0
    },
    decimal: Boolean, // 是否始终显示小数
    percent: Boolean, // 是否以百分比编辑（实际值会提高2个精度）
    minVal: {
      // 最小值
      type: Number,
      default: -Infinity
    },
    maxVal: {
      // 最大值
      type: Number,
      default: Infinity
    },
    defVal: {
      // 默认值
      type: Number,
      default: 0
    },
    formatter: Function, // 额外的输入值格式化函数
    normalizer: Function, // 额外的输入值矫正函数
    validator: Function // 额外的输入值校验函数
  },

  computed: {
    ...exposeChildProps('input', ['focused', 'hasRules', 'hasError'])
  },

  methods: {
    ...exposeChildMethods('input', ['blur', 'focus', 'resetValidation', 'select', 'validate']),

    // 格式化输入值
    format(val) {
      if (this.percent && val != null) {
        val *= 100
      }
      val = val == null ? '' : val.toFixed(Math.max(0, this.precision))
      if (val && !this.decimal) {
        val = String(+val)
      }
      return this.formatter ? this.formatter(val) : val
    },

    // 矫正输入值
    normalize(val) {
      if (typeof val !== 'string') {
        val = ''
      } else {
        val = val.trim()
        if (!NUMBER_FORMAT.test(val) || (this.minVal >= 0 && val.includes('-')) || (this.precision <= 0 && val.includes('.'))) {
          val = this.$refs.input.editValue
        }
      }
      return this.normalizer ? this.normalizer(val) : val
    },

    // 校验输入值
    validate(val) {
      val = val == null || val === '' ? null : Number(val)
      if (Number.isNaN(val)) {
        val = null
      }
      if (val != null) {
        const k = this.percent ? 100 : 1
        val = Math.max(this.minVal * k, Math.min(this.maxVal * k, val))
        const m = 10 ** this.precision
        val = Math.round(val * m) / m / k
      }
      return this.validator ? this.validator(val) : val
    }
  }
}
</script>
