<template>
  <ZoomView
    ref="view"
    class="absolute-full"
    :class="`bg-grey-${$q.dark.isActive ? 9 : 5}`"
    :min-x="Math.min(0, halfViewWidth - halfGridWidth - margin / viewZoom)"
    :max-x="Math.max(0, halfGridWidth + margin / viewZoom - halfViewWidth)"
    :min-y="Math.min(0, halfViewHeight - halfGridHeight - margin / viewZoom)"
    :max-y="Math.max(0, halfGridHeight + margin / viewZoom - halfViewHeight)"
    :zoom.sync="viewZoom"
    :min-zoom="minViewZoom"
    :max-zoom="maxViewZoom"
    @start-drag="$setCursor('grabbing')"
    @stop-drag="$setCursor(showDrawCursor ? 'crosshair' : '')"
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
    halfViewHeight: 100 // 视图高度的一半
  }),

  computed: {
    ...mapStateRW('main', ['viewZoom']),
    ...mapGetters('main', ['maxViewZoom', 'minViewZoom']),
    ...mapState('edit', ['xGrids', 'yGrids', 'brushMode']),
    ...mapStateRW('edit', ['brushPos', 'brushDown']),
    ...mapGetters('edit', ['halfGridWidth', 'halfGridHeight', 'getGridXY']),

    // 是否显示绘制光标
    showDrawCursor() {
      return this.brushDown || (!!this.brushPos && !!this.brushMode && !this.$refs.view.dragState)
    }
  },

  provide() {
    return {
      page: this
    }
  },

  watch: {
    // 切换绘制光标
    showDrawCursor(val) {
      this.$setCursor(val ? 'crosshair' : '')
    }
  },

  methods: {
    ...mapActions('edit', ['brushDraw']),

    // 页面坐标转格点坐标
    // - @return { x: X格点, y: Y格点 }（若格点越界则返回null）
    pageToGridXY(e) {
      const xy = this.$refs.view.pageToViewXY(e.pageX, e.pageY)
      const [x, y] = this.getGridXY(...xy)
      if (x < 0 || y < 0 || x >= this.xGrids || y >= this.yGrids) return null
      return { x, y }
    },

    // 按下处理
    onPress(e) {
      this.onMouseMove(e)
      if (!this.brushMode || !this.brushPos) return // 未选笔刷模式或起点不在网格中时不进行绘制
      if (key.isPressed(32)) return // 空格键按下时改为拖拽视图

      // 屏蔽视图拖拽
      this.$refs.view.$forceSet('interactive', false) // 若在模板中绑定该属性，会由于模板刷新导致click事件无法被屏蔽
      setTimeout(() => {
        this.$refs.view.$forceSet('interactive', true)
      })

      // 进行绘制
      this.brushDown = true
      this.brushDraw()
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
      const xy = this.pageToGridXY(e)
      if (!xy) {
        this.brushPos = null
      } else if (!this.brushPos || this.brushPos.x !== xy.x || this.brushPos.y !== xy.y) {
        this.brushPos = xy
        this.brushDown && this.brushDraw()
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
