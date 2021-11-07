<template>
  <q-layout class="absolute-full" view="hHh LpR fFf" container>
    <q-header elevated>
      <router-view name="title" />
    </q-header>

    <q-page-container>
      <q-page>
        <router-view />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
// 【主框架】
import { mapState, mapActions } from 'vuex'
import { FLOAT_PANEL_NAMES, showFloatPanel } from 'pages/panel'

export default {
  computed: {
    ...mapState('main', ['maximized', 'uiZoom']),
    ...mapState('main', [...FLOAT_PANEL_NAMES.map(i => i + 'Panel'), ...FLOAT_PANEL_NAMES.map(i => i + 'PanelFloat')]),
    ...FLOAT_PANEL_NAMES.map(i => [i + 'PanelShow', vm => vm[i + 'Panel'] && !vm[i + 'PanelFloat']]).toMap(0, i => i[1]),
    ...FLOAT_PANEL_NAMES.map(i => [i + 'PanelFloatShow', vm => vm[i + 'Panel'] && vm[i + 'PanelFloat']]).toMap(0, i => i[1])
  },

  watch: {
    // 显示浮动面板
    ...FLOAT_PANEL_NAMES.map(i => [
      i + 'PanelFloatShow',
      {
        handler: val => val && showFloatPanel(i),
        immediate: true
      }
    ]).toMap(0, i => i[1]),

    // 刷新界面缩放比率
    uiZoom: {
      handler(val) {
        document.documentElement.style.zoom = val
        this.$q.screen.width = window.innerWidth
        this.$q.screen.height = window.innerHeight
      },
      immediate: true
    }
  },

  methods: {
    ...mapActions('main', ['loadUIState'])
  },

  mounted() {
    // 自动恢复界面状态和编辑首选项
    this.loadUIState().then(() => {
      if (this.maximized) {
        this.$winCall('maximize')
      }
    })

    // 重载视窗大小属性，以加入缩放比率的处理
    const widthDiff = window.outerWidth - window.innerWidth
    const heightDiff = window.outerHeight - window.innerHeight
    Object.defineProperty(window, 'innerWidth', {
      get: () => {
        if (this.$q.fullscreen.isActive) {
          return Math.round(window.screen.availWidth / this.uiZoom)
        }
        return Math.round((window.outerWidth - widthDiff) / this.uiZoom)
      }
    })
    Object.defineProperty(window, 'innerHeight', {
      get: () => {
        if (this.$q.fullscreen.isActive) {
          return Math.round(window.screen.availHeight / this.uiZoom)
        }
        return Math.round((window.outerHeight - heightDiff) / this.uiZoom)
      }
    })
    Object.defineProperty(window.visualViewport, 'width', {
      get: () => {
        return window.innerWidth
      }
    })
    Object.defineProperty(window.visualViewport, 'height', {
      get: () => {
        return window.innerHeight
      }
    })
  }
}
</script>

<style lang="scss" scoped>
.q-layout-container ::v-deep > div > div {
  overflow: hidden; // 修复框架中间有个带scroll样式的层的问题
}
</style>
