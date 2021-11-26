<template>
  <div class="row items-center narrow">
    <label class="q-mr-sm" :class="labelClass" :style="combineLabelStyle" v-if="label">
      {{ label }}
      <CommonTips :tips="tips" v-if="tips" />
    </label>
    <component ref="ctrl" :is="component" :class="ctrlClass" :style="combineCtrlStyle" v-bind="combineParams" v-on="$listeners" />
    <slot />
  </div>
</template>

<script>
import CommonTips from './CommonTips.vue'

// 【通用表单控件】
export default {
  components: { CommonTips },
  inheritAttrs: false,

  props: {
    label: String, // 左侧文字标签
    labelClass: [String, Array, Object], // 左侧文字标签样式
    labelStyle: Object,
    labelWidth: Number, // 左侧文字标签宽度
    tips: [String, Array], // 提示说明文字
    component: {
      // 控件所用组件（可为已注册的组件名、组件定义或组件类）
      required: true
    },
    ctrlClass: [String, Array, Object], // 控件样式
    ctrlStyle: Object,
    ctrlParams: Object, // 控件参数表
    width: Number, // 控件最小宽度
    maxWidth: Number // 控件最大宽度
  },

  computed: {
    // 合并后的文字标签样式
    combineLabelStyle() {
      return this.labelWidth ? { width: this.labelWidth + 'px', ...this.labelStyle } : this.labelStyle
    },

    // 合并后的控件样式
    combineCtrlStyle() {
      const style = { ...this.ctrlStyle }
      if (this.width != null) {
        style.width = this.width + 'px'
      }
      if (this.maxWidth != null) {
        style.maxWidth = this.maxWidth + 'px'
      }
      return style
    },

    // 合并后的控件参数表
    combineParams() {
      return { ...this.$attrs, ...this.ctrlParams }
    }
  }
}
</script>
