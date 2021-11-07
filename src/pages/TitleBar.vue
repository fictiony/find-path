<template>
  <q-toolbar class="title-bar overflow-hidden" :class="$q.dark.isActive ? 'bg-grey-8' : ''">
    <q-avatar class="no-drag-app q-mr-sm" size="32px" @click="about">
      <img src="~assets/icon.png" draggable="false" />
    </q-avatar>
    <div class="title-font q-mr-md text-no-wrap">{{ appTitle }}</div>

    <q-btn
      v-for="(info, name) in mainMenu"
      :key="name"
      class="no-drag-app"
      style="width: 50px"
      flat
      noWrap
      :label="info.label"
      :style="info.open ? 'background-color: #ffffff33' : ''"
      @mouseover="hoverMenu(name)"
      @click.capture.stop
    >
      <CustomMenu v-model="info.open" :items="$data[name]" :offset="[0, -2]" key-scope="main" />
    </q-btn>

    <div ref="stats" class="relative-position full-height" />
    <q-space />

    <q-btn class="no-drag-app q-px-xs" flat dense icon="minimize" @click="minimize" />
    <q-btn class="no-drag-app q-px-xs" flat dense :icon="maximized || $q.fullscreen.isActive ? 'filter_none' : 'crop_square'" @click="maximize" />
    <q-btn class="no-drag-app q-px-xs" flat dense icon="close" @click="quit" />
  </q-toolbar>
</template>

<script>
// 【标题栏】
import { mapState, mapGetters, mapActions } from 'vuex'
import { mapStateRW } from 'boot/utils'
import * as dlg from 'pages/dialog'
import { Stats } from 'three-stats'

// 浮动面板
const FLOAT_PANELS = {
  // xxx: ''
}

export default {
  data: vm => ({
    mainMenu: {
      viewMenu: { label: '视图', open: false },
      helpMenu: { label: '帮助', open: false }
    },
    viewMenu: [
      ...Object.keys(FLOAT_PANELS).map(
        name =>
          FLOAT_PANELS[name] && {
            label: FLOAT_PANELS[name],
            icon: () => (vm[name] ? 'done' : ''),
            handler: () => (vm[name] = !vm[name])
          }
      ),
      null,
      {
        label: '放大界面',
        shortcut: 'Ctrl+Shift+=',
        keyScope: 'all',
        handler: () => vm.zoomUI(vm.uiZoom + 0.1),
        disable: () => vm.uiZoom >= vm.maxUIZoom
      },
      {
        label: '缩小界面',
        shortcut: 'Ctrl+Shift+-',
        keyScope: 'all',
        handler: () => vm.zoomUI(vm.uiZoom - 0.1),
        disable: () => vm.uiZoom <= vm.minUIZoom
      },
      {
        label: '界面恢复1:1缩放',
        shortcut: 'Ctrl+Shift+0',
        keyScope: 'all',
        handler: () => vm.zoomUI(1),
        disable: () => vm.uiZoom === 1
      },
      null,
      {
        label: '重置UI布局',
        icon: 'settings_backup_restore',
        handler: vm.doResetUIState
      }
    ],
    helpMenu: [
      {
        label: () => `${vm.$q.dark.isActive ? '亮' : '暗'}色界面`,
        icon: () => (vm.$q.dark.isActive ? 'light_mode' : 'dark_mode'),
        handler: () => (vm.darkTheme = !vm.darkTheme)
      },
      null,
      {
        label: '性能监视器',
        icon: 'insert_chart_outlined',
        shortcut: 'Ctrl+F11',
        keyScope: 'all',
        handler: vm.showStat
      },
      ...(vm.$inspector
        ? [
            {
              label: '组件监视器',
              icon: 'gps_fixed',
              shortcut: 'Ctrl+F12',
              keyScope: 'all',
              handler: vm.$inspector
            }
          ]
        : []),
      null,
      {
        label: '关于...',
        handler: vm.about
      }
    ]
  }),

  computed: {
    ...mapState('main', ['appTitle', 'loading', 'maximized']),
    ...mapStateRW('main', [...Object.keys(FLOAT_PANELS).filter(i => FLOAT_PANELS[i]), 'darkTheme', 'uiZoom']),
    ...mapGetters('main', ['maxUIZoom', 'minUIZoom'])
  },

  watch: {
    darkTheme(val) {
      this.$q.dark.isActive = val
    },

    loading(val) {
      if (val) {
        this.$q.loading.show(typeof val === 'string' ? { message: val } : {})
      } else {
        this.$q.loading.hide()
      }
    }
  },

  methods: {
    ...mapActions('main', ['resetUIState']),

    // 鼠标滑过菜单自动弹出
    hoverMenu(name) {
      Object.keys(this.mainMenu).forEach(name => {
        this.mainMenu[name].open = false
      })
      this.mainMenu[name].open = true
    },

    // 最小化
    minimize() {
      this.$winCall('minimize')
    },

    // 最大化
    maximize() {
      this.$winCall(this.maximized || this.$q.fullscreen.isActive ? 'unmaximize' : 'maximize')
    },

    // 退出
    quit() {
      this.$appCall('quit')
    },

    // 缩放界面
    // - @zoom 新缩放比率
    zoomUI(zoom) {
      this.uiZoom = Math.min(this.maxUIZoom, Math.max(this.minUIZoom, zoom))
    },

    // 重置UI布局
    async doResetUIState() {
      const answer = await this.$showAsk('是否确定要重置UI布局到初始默认状态？')
      if (!answer) return
      this.resetUIState()
    },

    // 性能监视器
    showStat() {
      if (this.stats) {
        this.$refs.stats.removeChild(this.stats.dom)
        delete this.stats
      } else {
        this.stats = new Stats()
        this.stats.dom.classList.add('no-drag-app')
        Object.assign(this.stats.dom.style, {
          position: 'absolute',
          top: '-8px',
          transform: this.$makeTransform([1, 32 / 48]),
          opacity: 1
        })
        this.$refs.stats.appendChild(this.stats.dom)
        const update = () => {
          if (!this.stats) return
          window.requestAnimationFrame(update)
          this.stats.update()
        }
        update()
      }
    },

    // 关于
    about() {
      this.$showMsg(dlg.AboutDialog, '关于')
    }
  }
}
</script>
