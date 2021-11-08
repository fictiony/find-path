<template>
  <q-menu ref="menu" content-class="custom-menu" v-bind="$attrs" v-on="$listeners">
    <q-list dense class="_list">
      <template v-for="(item, index) in items">
        <q-item
          :key="index"
          clickable
          :disable="getItemProp(item, 'disable')"
          @click="item.handler && ($refs.menu.hide() || item.handler())"
          v-if="item"
        >
          <q-item-section avatar class="_icon" v-if="items.find(i => i && i.icon)">
            <q-icon :name="getItemProp(item, 'icon')" size="xs" v-if="item && item.icon" />
          </q-item-section>
          <q-item-section>{{ getItemProp(item, 'label') }}</q-item-section>
          <q-item-section side v-if="item.shortcut">{{ getItemProp(item, 'shortcut') }}</q-item-section>
        </q-item>
        <q-separator :key="`sep-${index}`" v-else />
      </template>
    </q-list>
  </q-menu>
</template>

<script>
// 【自定义菜单】
import key from 'keymaster'
import { exposeChildMethods } from 'boot/utils'

export default {
  inheritAttrs: false,

  props: {
    items: {
      // 菜单项列表：[{ label: 文字, icon: 图标, shortcut: 快捷键, keyScope: 快捷键作用域, handler: 处理函数, disable: 是否禁用 }]
      // 各属性均可为函数，返回值为实际属性值
      type: Array,
      required: true
    },
    keyScope: {
      // 快捷键作用域（当菜单项中没有特别指定时，默认采用此作用域）
      type: String,
      default: 'all'
    }
  },

  watch: {
    items: {
      handler(val, oldVal) {
        oldVal && this.unbindShortcuts(oldVal)
        this.bindShortcuts(val)
      },
      immediate: true
    }
  },

  methods: {
    ...exposeChildMethods('menu', ['show', 'hide', 'toggle', 'focus', 'updatePosition']),

    // 绑定快捷键
    bindShortcuts(items) {
      items.forEach(item => {
        if (!item || !item.shortcut) return
        const shortcut = this.getItemProp(item, 'shortcut').toLowerCase()
        const keyScope = this.getItemProp(item, 'keyScope') || this.keyScope
        key(shortcut, keyScope, () => {
          if (item.handler && !this.getItemProp(item, 'disable')) {
            this.$refs.menu.hide()
            item.handler()
          }
          return false // 始终屏蔽系统热键
        })
      })
    },

    // 清除快捷键
    unbindShortcuts(items) {
      items.forEach(item => {
        if (!item || !item.shortcut) return
        const shortcut = this.getItemProp(item, 'shortcut').toLowerCase()
        const keyScope = this.getItemProp(item, 'keyScope') || this.keyScope
        key.unbind(shortcut, keyScope)
      })
    },

    // 获取菜单项属性
    getItemProp(item, prop) {
      return item[prop] instanceof Function ? item[prop]() : item[prop]
    }
  },

  beforeDestroy() {
    this.unbindShortcuts(this.items)
  }
}
</script>

<style lang="scss">
.custom-menu {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  max-height: 85%;
}
</style>
<style lang="scss" scoped>
._list {
  min-width: 120px;
}
._icon {
  min-width: 26px;
  padding: 0px;
  margin-left: -6px;
}
</style>
