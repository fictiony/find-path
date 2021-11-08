<template>
  <div class="row items-center narrow">
    <label class="q-mr-sm" :class="labelClass" :style="combineLabelStyle" v-if="label">
      {{ label }}
      <q-tooltip max-width="400px" anchor="top left" self="top right" v-if="tips">
        <q-markdown :src="tips" v-if="mdTips" />
        <template v-else>{{ tips }}</template>
      </q-tooltip>
    </label>
    <component ref="ctrl" :is="component" :class="ctrlClass" :style="combineCtrlStyle" v-bind="$attrs" v-on="$listeners" />
    <slot />
  </div>
</template>

<script>
// 【通用表单控件】
export default {
  inheritAttrs: false,

  props: {
    label: String, // 左侧文字标签
    labelClass: [String, Array, Object], // 左侧文字标签样式
    labelStyle: Object,
    labelWidth: Number, // 左侧文字标签宽度
    tips: String, // 提示说明文字
    mdTips: Boolean, // 提示是否采用Markdown格式
    component: {
      // 控件所用组件（可为已注册的组件名、组件定义或组件类）
      required: true
    },
    ctrlClass: [String, Array, Object], // 控件样式
    ctrlStyle: Object,
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
    }
  }
}
</script>
