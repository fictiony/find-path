<template>
  <q-btn
    ref="btn"
    flat
    :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-2 text-primary'"
    style="height: 34px"
    :label="computedLabel"
    :icon="computedIcon"
    v-bind="$attrs"
    v-on="$listeners"
    @click="onClick"
  >
    <q-tooltip max-width="400px" anchor="top middle" self="bottom middle" v-if="tips">
      <q-markdown :src="tips" />
    </q-tooltip>
  </q-btn>
</template>

<script>
// 【通用表单按钮】
import key from 'keymaster'
import { exposeChildMethods } from 'boot/utils'

export default {
  inheritAttrs: false,

  props: {
    value: {}, // 关联数据
    label: [String, Function], // 按钮标签，为函数时格式为：关联数据 => 按钮标签
    icon: [String, Function], // 按钮图标，为函数时格式为：关联数据 => 按钮图标
    tips: String, // 提示说明文字
    shortcut: String, // 快捷键
    keyScope: {
      // 快捷键作用域
      type: String,
      default: 'all'
    }
  },

  computed: {
    // 计算后的按钮标签
    computedLabel() {
      return this.label instanceof Function ? String(this.label(this.value)) : this.label
    },

    // 计算后的按钮图标
    computedIcon() {
      return this.icon instanceof Function ? String(this.icon(this.value)) : this.icon
    }
  },

  watch: {
    shortcut: {
      handler(val, oldVal) {
        this.$nextTick(() => {
          // 延后一帧，避免和其他按钮删除时的解绑快捷键冲突
          this.unbindShortcut(oldVal, this.keyScope)
          this.bindShortcut(val, this.keyScope)
        })
      },
      immediate: true
    },

    keyScope: {
      handler(val, oldVal) {
        this.$nextTick(() => {
          this.unbindShortcut(this.shortcut, oldVal)
          this.bindShortcut(this.shortcut, val)
        })
      },
      immediate: true
    }
  },

  methods: {
    ...exposeChildMethods('btn', ['click']),

    // 绑定快捷键
    bindShortcut(shortcut, keyScope) {
      if (!shortcut) return
      key(shortcut.toLowerCase(), keyScope, () => {
        if (!this.$refs.btn.disable) {
          this.$emit('input', this.value)
        }
        return false // 始终屏蔽系统热键
      })
    },

    // 清除快捷键
    unbindShortcut(shortcut, keyScope) {
      if (!shortcut) return
      key.unbind(shortcut.toLowerCase(), keyScope)
    },

    // 按钮点击处理
    onClick() {
      this.$emit('input', this.value)
    }
  },

  beforeDestroy() {
    this.unbindShortcut(this.shortcut, this.keyScope)
  }
}
</script>
