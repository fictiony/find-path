<template>
  <ZoomView
    ref="view"
    class="absolute-full"
    :class="`bg-grey-${$q.dark.isActive ? 9 : 4}`"
    :min-x="Math.min(0, halfViewWidth - halfGridWidth - margin / viewZoom)"
    :max-x="Math.max(0, halfGridWidth + margin / viewZoom - halfViewWidth)"
    :min-y="Math.min(0, halfViewHeight - halfGridHeight - margin / viewZoom)"
    :max-y="Math.max(0, halfGridHeight + margin / viewZoom - halfViewHeight)"
    :zoom.sync="viewZoom"
    :min-zoom="minViewZoom"
    :max-zoom="maxViewZoom"
    @start-drag="refreshCursor"
    @stop-drag="refreshCursor"
    @resize="(w, h) => ((halfViewWidth = w / 2), (halfViewHeight = h / 2))"
    @mousedown.native.capture="onPress"
    @mousedown.native="$clearFocus"
    @mouseup.native="brushDown = false"
    @mousemove.native="onMouseMove"
    @mouseout.native="brushPos = null"
    @touchstart.native.capture="onPress"
    @touchstart.native="$clearFocus"
    @touchend.native=";(brushPos = null), (brushDown = false)"
    @touchcancel.native=";(brushPos = null), (brushDown = false)"
    v-touch-pan.mouse.preserveCursor="onDrag"
  >
    <router-view name="grid" ref="grid" />
  </ZoomView>
</template>

<script>
// 【主视图区】
import { mapState, mapGetters, mapActions } from 'vuex'
import { mapStateRW } from 'boot/utils'
import key from 'keymaster'

export default {
  data: () => ({
    margin: 50, // 边缘留白
    halfViewWidth: 100, // 视图宽度的一半
    halfViewHeight: 100, // 视图高度的一半
    brushDown: false, // 笔刷当前是否按下
    brushDownPos: null, // 笔刷按下时的坐标
    brushDir: 0 // 笔刷初始移动方向（用于锁定绘制方向）：0-未知/1-横向/2-纵向
  }),

  computed: {
    ...mapStateRW('main', ['viewZoom']),
    ...mapGetters('main', ['maxViewZoom', 'minViewZoom']),
    ...mapState('edit', ['xGrids', 'yGrids', 'autoFind', 'brushMode', 'lockBrushDir']),
    ...mapStateRW('edit', ['pointMode', 'startPos', 'endPos', 'brushPos']),
    ...mapGetters('edit', ['halfGridWidth', 'halfGridHeight', 'getGridXY']),

    // 是否正在拖拽视图
    isDragging() {
      return !!(this.$refs.view && this.$refs.view.dragState)
    },

    // 是否显示绘制光标
    showDrawCursor() {
      return this.brushDown || !!((this.pointMode || this.brushMode) && this.brushPos)
    }
  },

  provide() {
    return {
      page: this
    }
  },

  watch: {
    // 切换绘制光标
    showDrawCursor: 'refreshCursor',

    // 起始点改变后自动切换到终点，起止点都指定后自动寻路
    startPos(val) {
      if (val) {
        this.pointMode = 2
        if (this.endPos && this.autoFind) {
          this.findPath(0)
        }
      }
    },
    endPos(val) {
      if (val && this.startPos && this.autoFind) {
        this.findPath(0)
      }
    }
  },

  methods: {
    ...mapActions('edit', ['brushDraw', 'findPath']),

    // 页面坐标转格点坐标
    // - @return { x: X格点, y: Y格点 }（若格点越界则返回null）
    pageToGridXY(e) {
      const xy = this.$refs.view.pageToViewXY(e.pageX, e.pageY)
      const [x, y] = this.getGridXY(...xy)
      if (x < 0 || y < 0 || x >= this.xGrids || y >= this.yGrids) return null
      return { x, y }
    },

    // 刷新鼠标光标
    refreshCursor() {
      this.$setCursor(this.isDragging ? 'grabbing' : this.showDrawCursor ? 'crosshair' : '')
    },

    // 按下处理
    onPress(e) {
      this.onMouseMove(e)
      if (!(this.pointMode || this.brushMode) || !this.brushPos) return // 未选起止点模式或笔刷模式或起点不在网格中时不进行绘制
      if (key.isPressed(32)) return // 空格键按下时改为拖拽视图

      // 屏蔽视图拖拽
      this.$refs.view.$forceSet('interactive', false) // 若在模板中绑定该属性，会引发不必要的模板刷新
      setTimeout(() => {
        this.$refs.view.$forceSet('interactive', true)
      })

      // 若已选起止点模式，则优先设置起止点
      if (this.pointMode === 1) {
        this.startPos = { ...this.brushPos }
      } else if (this.pointMode === 2) {
        this.endPos = { ...this.brushPos }
      } else {
        // 进行绘制
        this.brushDown = true
        this.brushDownPos = { ...this.brushPos }
        this.brushDir = 0
        this.brushDraw()
      }
    },

    // 拖拽处理
    onDrag(e) {
      this.onMouseMove(e.evt)
      if (!this.brushDown) return
      if (e.isFinal) {
        this.brushDown = false
      }
    },

    // 鼠标移动处理
    onMouseMove(e) {
      e = e.touches ? e.touches[0] || e.changedTouches[0] : e // 触点放开时没有touches，因此要改用changedTouches
      const pos = this.pageToGridXY(e)
      if (!pos) {
        this.brushPos = null
      } else if (!this.brushPos || this.brushPos.x !== pos.x || this.brushPos.y !== pos.y) {
        this.brushPos = pos
        if (this.brushDown) {
          if (this.brushDir === 0) {
            const dx = Math.abs(pos.x - this.brushDownPos.x)
            const dy = Math.abs(pos.y - this.brushDownPos.y)
            this.brushDir = dx > dy ? 1 : 2
          }
          if (this.lockBrushDir || key.isPressed(16)) {
            // Shift键按下时锁定笔刷移动方向
            this.brushDraw({
              x: this.brushDir === 2 ? this.brushDownPos.x : pos.x,
              y: this.brushDir === 1 ? this.brushDownPos.y : pos.y
            })
          } else {
            this.brushDraw()
          }
        }
      }
    }
  },

  mounted() {
    if (process.env.DEBUGGING) {
      window.$m = this
    }

    // 绑定快捷键
    key.setScope('main')
  }
}
</script>
