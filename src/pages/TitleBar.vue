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

    <EditHint />

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
import { ALGORITHMS, DIAGONAL_MOVES, POINT_MODES, BRUSH_MODES } from 'boot/draw'
import { Stats } from 'three-stats'

// 浮动面板
const FLOAT_PANELS = {
  toolPanel: ['工具栏', 'Ctrl+T'],
  toolPanelFloat: ['工具栏浮动', 'Ctrl+Shift+T'],
  operatePanel: ['操作面板', 'Ctrl+O']
}

export default {
  data: vm => ({
    mainMenu: {
      findPathMenu: { label: '寻路', open: false },
      obstacleMenu: { label: '障碍', open: false },
      editMenu: { label: '编辑', open: false },
      viewMenu: { label: '视图', open: false },
      helpMenu: { label: '帮助', open: false }
    },
    findPathMenu: [
      ...ALGORITHMS.map(i => {
        return {
          label: i.label,
          icon: () => (vm.algorithm === i.value ? 'done' : ''),
          handler: () => (vm.algorithm = i.value)
        }
      }),
      null,
      ...DIAGONAL_MOVES.map(i => {
        return {
          label: i.label,
          icon: () => (vm.diagonalMove === i.value ? 'done' : ''),
          handler: () => (vm.diagonalMove = i.value)
        }
      }),
      null,
      ...POINT_MODES.map(i => {
        return {
          label: () => `指定${i.name}${vm.pointMode === i.value ? ' (当前)' : ''}`,
          icon: i.icon,
          shortcut: i.shortcut,
          handler: () => (vm.pointMode = vm.pointMode === i.value ? null : i.value)
        }
      }),
      {
        label: '清除起点终点',
        icon: 'clear',
        shortcut: 'Esc',
        handler: vm.clearPoints
      },
      null,
      {
        label: '进行寻路', // 暂停寻路、继续寻路
        icon: 'play_arrow',
        shortcut: 'F9',
        handler: vm.findPath,
        disable: () => !vm.startPos || !vm.endPos
      },
      {
        label: '显示寻路状态',
        shortcut: 'F6',
        icon: () => (vm.showState ? 'done' : ''),
        handler: () => (vm.showState = !vm.showState)
      }
    ],
    obstacleMenu: [
      ...BRUSH_MODES.map(i => {
        return {
          label: () => `${i.name}模式${vm.brushMode === i.value ? ' (当前)' : ''}`,
          icon: i.icon,
          shortcut: i.shortcut,
          handler: () => {
            vm.pointMode = null
            vm.brushMode = vm.brushMode === i.value ? null : i.value
          }
        }
      }),
      null,
      {
        label: '笔刷调大',
        icon: 'add_circle_outline',
        shortcut: '=',
        handler: () => (vm.brushSize = Math.min(200, Math.ceil(vm.brushSize * 1.2))),
        disable: () => vm.brushSize >= 200
      },
      {
        label: '笔刷调小',
        icon: 'remove_circle_outline',
        shortcut: '-',
        handler: () => (vm.brushSize = Math.max(1, Math.floor(vm.brushSize / 1.2))),
        disable: () => vm.brushSize <= 1
      },
      {
        label: '单格笔刷',
        icon: 'crop_square',
        shortcut: '0',
        handler: () => (vm.brushSize = 1),
        disable: () => vm.brushSize === 1
      },
      null,
      {
        label: '硬笔刷',
        icon: 'format_paint',
        shortcut: 'H',
        handler: () => (vm.brushSoft = 0)
      },
      {
        label: '软笔刷',
        icon: 'brush',
        shortcut: 'S',
        handler: () => (vm.brushSoft = 50)
      },
      null,
      {
        label: '最弱阻碍',
        icon: 'filter_1',
        shortcut: '1',
        handler: () => (vm.brushState = 1)
      },
      {
        label: '最强阻碍',
        icon: 'filter_9',
        shortcut: '9',
        handler: () => (vm.brushState = 100)
      },
      {
        label: '绝对阻挡',
        icon: 'filter_9_plus',
        shortcut: '`',
        handler: () => (vm.brushState = 200)
      }
    ],
    editMenu: [
      {
        label: '加载网格',
        icon: 'upload',
        shortcut: 'Ctrl+L',
        handler: vm.loadGrids
      },
      {
        label: '保存网格',
        icon: 'download',
        shortcut: 'Ctrl+S',
        handler: vm.saveGrids
      },
      null,
      {
        label: '复制网格',
        icon: 'content_copy',
        shortcut: 'Ctrl+C',
        handler: vm.copyGrids
      },
      {
        label: '清空网格',
        icon: 'delete_outline',
        shortcut: 'Ctrl+D',
        handler: vm.clearGrids
      },
      null,
      {
        label: '锁定水平垂直绘制',
        icon: () => (vm.lockBrushDir ? 'done' : ''),
        handler: () => (vm.lockBrushDir = !vm.lockBrushDir)
      }
    ],
    viewMenu: [
      ...Object.keys(FLOAT_PANELS).map(name => {
        const panel = FLOAT_PANELS[name]
        if (!panel) return null
        return {
          label: panel[0],
          icon: () => (vm[name] ? 'done' : ''),
          shortcut: panel[1],
          handler: () => (vm[name] = !vm[name])
        }
      }),
      null,
      {
        label: '放大视图',
        icon: 'zoom_in',
        shortcut: 'Ctrl+=',
        handler: () => vm.zoomView(vm.viewZoom * Math.SQRT2),
        disable: () => vm.viewZoom >= vm.maxViewZoom
      },
      {
        label: '缩小视图',
        icon: 'zoom_out',
        shortcut: 'Ctrl+-',
        handler: () => vm.zoomView(vm.viewZoom * Math.SQRT1_2),
        disable: () => vm.viewZoom <= vm.minViewZoom
      },
      {
        label: '视图恢复1:1缩放',
        icon: '1x_mobiledata',
        shortcut: 'Ctrl+0',
        handler: () => vm.zoomView(1),
        disable: () => vm.viewZoom === 1
      },
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
            },
            {
              label: '查看格子状态表',
              handler: () => {
                console.log('【笔刷】\n', vm.$clone(vm.$store.getters['edit/brushStates']))
                console.log('【全图】\n', vm.$clone(vm.$store.state.edit.gridStates))
              }
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
    ...mapState('main', ['appTitle', 'loading', 'maximized', 'viewZoom', 'uiZoom']),
    ...mapStateRW('main', ['darkTheme', ...Object.keys(FLOAT_PANELS).filter(i => FLOAT_PANELS[i])]),
    ...mapGetters('main', ['maxViewZoom', 'minViewZoom', 'maxUIZoom', 'minUIZoom']),
    ...mapState('edit', ['startPos', 'endPos']),
    ...mapStateRW('edit', ['algorithm', 'diagonalMove', 'showState', 'pointMode']),
    ...mapStateRW('edit', ['brushMode', 'brushSize', 'brushSoft', 'brushState', 'lockBrushDir'])
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
    ...mapActions('main', ['resetUIState', 'zoomView', 'zoomUI']),
    ...mapActions('edit', ['loadGrids', 'saveGrids', 'copyGrids', 'clearGrids', 'clearPoints', 'findPath']),

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
