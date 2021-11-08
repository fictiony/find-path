<template>
  <div class="row items-center narrow">
    <label class="q-mr-sm" :class="labelClass" :style="combineLabelStyle" v-if="label">
      {{ label }}
      <q-tooltip max-width="400px" anchor="top left" self="top right" v-if="tips">
        <q-markdown :src="tips" v-if="mdTips" />
        <template v-else>{{ tips }}</template>
      </q-tooltip>
    </label>
    <q-input
      ref="input"
      dense
      :class="qInputClass"
      :style="combineInputStyle"
      :placeholder="$attrs.placeholder || defVal"
      v-bind="$attrs"
      v-on="{ ...$listeners, input: () => {} }"
      :value="editValue"
      @input="onInput"
      @blur="onEnter"
      @keyup.native.enter="onEnter"
    />
    <slot />
  </div>
</template>

<script>
// 【通用输入框】
import { exposeChildProps, exposeChildMethods } from 'boot/utils'

export default {
  inheritAttrs: false,

  data: vm => ({
    editValue: vm.format(vm.value) // 当前编辑值
  }),

  props: {
    label: String, // 左侧文字标签
    labelClass: [String, Array, Object], // 左侧文字标签样式
    labelStyle: Object,
    labelWidth: Number, // 左侧文字标签宽度
    tips: String, // 提示说明文字
    mdTips: Boolean, // 提示是否采用Markdown格式
    qInputClass: [String, Array, Object], // 输入框组件样式
    qInputStyle: Object,
    width: {
      // 输入框组件最小宽度
      type: Number,
      default: 100
    },
    maxWidth: Number, // 输入框组件最大宽度
    value: {
      // 输入值
      required: true
    },
    defVal: {}, // 默认值（输入完成时若输入值为空，则自动更新为默认值）
    formatter: Function, // 输入值格式化函数
    normalizer: Function, // 输入值矫正函数（影响editValue，输入时实时处理）
    validator: Function, // 输入值校验函数（影响value，更新前处理）
    immediate: Boolean // 是否输入时立即校验并更新
  },

  computed: {
    ...exposeChildProps('input', ['focused', 'hasRules', 'hasError']),

    // 合并后的文字标签样式
    combineLabelStyle() {
      return this.labelWidth ? { width: this.labelWidth + 'px', ...this.labelStyle } : this.labelStyle
    },

    // 合并后的输入框样式
    combineInputStyle() {
      const style = { width: this.width + 'px', ...this.qInputStyle }
      if (this.maxWidth != null) {
        style.maxWidth = this.maxWidth + 'px'
      }
      return style
    }
  },

  watch: {
    value(val) {
      this.editValue = this.format(val)
    },

    editValue(val) {
      if (this.immediate) {
        if (this.validator) {
          val = this.validator(val)
        }
        this.updateValue(val, true)
      } else {
        this.forceRefresh()
      }
    }
  },

  methods: {
    ...exposeChildMethods('input', ['blur', 'focus', 'resetValidation', 'select', 'validate']),

    // 格式化输入值
    format(val) {
      return (this.formatter || String)(val)
    },

    // 更新输入值
    updateValue(val, forceRefresh) {
      this.updateEditValue(this.format(val), forceRefresh)
      if (val !== this.value) {
        this.$emit('input', val)
      }
    },

    // 更新编辑值
    updateEditValue(val, forceRefresh) {
      if (val === this.editValue) {
        forceRefresh && this.forceRefresh()
      } else {
        this.editValue = val
      }
    },

    // 必须失去下焦点，否则显示不会刷新
    forceRefresh() {
      const activeEl = document.activeElement
      const hasFocus = activeEl && this.$refs.input.$refs.input === activeEl
      if (hasFocus) {
        const caretPos = this.$refs.input.$refs.input.selectionStart
        const len = this.$refs.input.$refs.input.value.length
        this.$refs.input.blur()
        this.$refs.input.focus()
        setTimeout(() => {
          const pos = Math.max(0, caretPos + this.$refs.input.$refs.input.value.length - len)
          this.$refs.input.$refs.input.setSelectionRange(pos, pos)
        })
      }
    },

    // 输入时处理
    onInput(val) {
      if (this.normalizer) {
        val = this.normalizer(val)
      }
      this.updateEditValue(val, true)
    },

    // 输入完成时处理
    onEnter() {
      let val = this.editValue
      if (this.immediate) {
        val = this.value
      } else if (this.validator) {
        val = this.validator(val)
      }
      if (this.defVal !== undefined && (val == null || val === '')) {
        val = this.defVal
      }
      this.updateValue(val)
    }
  }
}
</script>
