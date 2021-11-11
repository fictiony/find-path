<template>
  <div @mousedown.prevent="onMouseDown" @mousewheel.prevent="onMouseWheel" @touchstart.prevent="onTouchStart">
    <q-resize-observer debounce="0" @resize="updateViewSize" />
    <div class="absolute" :style="contentStyle">
      <slot />
    </div>
  </div>
</template>

<script>
// 【可缩放视图】
import { mapState } from 'vuex'
import { swapProp } from 'components/thirdparty/plus/mixins'

const CAPTURE = { capture: true }
const PASSIVE_CAPTURE = { passive: true, capture: true }

export default {
  mixins: [swapProp('x', 'viewX'), swapProp('y', 'viewY'), swapProp('zoom', 'viewZoom')],

  data: () => ({
    viewWidth: 100, // 视区宽度
    viewHeight: 100, // 视区高度
    dragState: null // 当前拖拽状态，鼠标拖拽时格式为：{ x: 鼠标起始页面X坐标, y: 鼠标起始页面Y坐标, initX: 初始视区中心点X坐标, initY: 初始视区中心点Y坐标 }
    // 触点拖拽时格式为：{ x: 触点1起始页面X坐标, y: 触点1起始页面Y坐标, x2: 触点2起始页面X坐标, y2: 触点2起始页面Y坐标, zoomX: 缩放中心点X坐标, zoomY: 缩放中心点Y坐标,
    // zoomSize: 起始缩放大小（即触点间距）, ids: 触点ID列表, initX: 初始视区中心点X坐标, initY: 初始视区中心点Y坐标, initZoom: 初始视区缩放比率 }
    // 其中x2/y2/zoomX/zoomY/zoomSize/initZoom只有当有多个触点时才有值，initX/initY/initZoom只有当拖拽正式开始（即拖拽量超过阀值）后才有值
  }),

  props: {
    x: {
      // 当前视区中心点X坐标
      type: Number,
      default: 0
    },
    y: {
      // 当前视区中心点Y坐标
      type: Number,
      default: 0
    },
    zoom: {
      // 当前视图缩放比率
      type: Number,
      default: 1
    },
    minX: {
      // 视区中心点最小X坐标
      type: Number,
      default: -Infinity
    },
    maxX: {
      // 视区中心点最大X坐标
      type: Number,
      default: Infinity
    },
    minY: {
      // 视区中心点最小Y坐标
      type: Number,
      default: -Infinity
    },
    maxY: {
      // 视区中心点最大Y坐标
      type: Number,
      default: Infinity
    },
    minZoom: {
      // 视图最小缩放比率
      type: Number,
      default: 0.01
    },
    maxZoom: {
      // 视图最大缩放比率
      type: Number,
      default: 10
    },
    wheelZoomRate: {
      // 鼠标滚轮每行缩放比率
      type: Number,
      default: 1.1
    },
    threshold: {
      // 拖拽量阀值（单位：像素）
      type: Number,
      default: 3
    },
    interactive: {
      // 是否允许交互操作（若已在拖拽中则忽略）
      type: Boolean,
      default: true
    }
  },

  computed: {
    ...mapState('main', ['uiZoom']),

    contentStyle() {
      return {
        left: this.viewWidth / 2 - this.viewX * this.viewZoom + 'px',
        top: this.viewHeight / 2 - this.viewY * this.viewZoom + 'px',
        transform: this.$makeTransform(this.viewZoom)
      }
    }
  },

  watch: {
    x: 'refreshViewX',
    y: 'refreshViewY',
    zoom: 'refreshViewZoom',
    minX: 'refreshViewX',
    maxX: 'refreshViewX',
    minY: 'refreshViewY',
    maxY: 'refreshViewY',
    minZoom: 'refreshViewZoom',
    maxZoom: 'refreshViewZoom',
    viewWidth: 'emitResize',
    viewHeight: 'emitResize',
    viewZoom: 'emitResize',
    viewX: 'emitMove',
    viewY: 'emitMove'
  },

  methods: {
    // 更新视区大小
    updateViewSize(size) {
      this.viewWidth = size.width
      this.viewHeight = size.height
    },

    // 更新视区中心点坐标
    updateViewCenter(x, y) {
      if (this.__ignoreRangeLimit) {
        this.viewX = Number(x)
        this.viewY = Number(y)
      } else {
        this.viewX = Math.max(this.minX, Math.min(this.maxX, Number(x)))
        this.viewY = Math.max(this.minY, Math.min(this.maxY, Number(y)))
      }
    },

    // 更新视图缩放比率
    // - @x, y 缩放中心点坐标（默认取视区中心点坐标）
    // - @oldZoom 指定原视图缩放比率（默认取当前视图缩放比率）
    updateViewZoom(zoom, x, y, oldZoom) {
      oldZoom ||= this.viewZoom
      this.viewZoom = Number(zoom)
      this.refreshViewZoom()
      const dx = x == null ? 0 : x - this.viewX
      const dy = y == null ? 0 : y - this.viewY
      const dz = 1 - oldZoom / this.viewZoom
      if (dz && (dx || dy)) {
        this.updateViewCenter(this.viewX + dx * dz, this.viewY + dy * dz)
      }
    },

    // 刷新视区中心点X坐标
    refreshViewX() {
      this.viewX = Math.max(this.minX, Math.min(this.maxX, this.viewX))
    },

    // 刷新视区中心点Y坐标
    refreshViewY() {
      this.viewY = Math.max(this.minY, Math.min(this.maxY, this.viewY))
    },

    // 刷新视图缩放比率
    refreshViewZoom() {
      this.viewZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.viewZoom))
    },

    // 判断拖拽量是否达到阀值
    overThreshold(dx, dy) {
      return Math.abs(dx) > this.threshold || Math.abs(dy) > this.threshold
    },

    // 页面坐标转视图坐标
    // - @x, y 页面坐标（以像素为单位）
    // - @return [视图X坐标, 视图Y坐标]
    pageToViewXY(x, y) {
      const rect = this.$el.getBoundingClientRect()
      const dx = (x / this.uiZoom - rect.x - this.viewWidth / 2) / this.viewZoom
      const dy = (y / this.uiZoom - rect.y - this.viewHeight / 2) / this.viewZoom
      return [this.viewX + dx, this.viewY + dy]
    },

    // 判断触点变动情况
    // - @return 变动情况：0-无变动/1-触点1变动/2-触点2变动/3-触点12都变动
    checkTouchChange(e) {
      const ids = this.dragState.ids
      let change = 0
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        const index = ids.indexOf(touch.identifier)
        if (index < 0) continue
        change |= 1 << index
      }
      return change
    },

    // 获取指定触点页面坐标
    // - @index 触点序号
    // - @return [触点页面X坐标, 触点页面Y坐标]
    getTouchPageXY(e, index) {
      const ds = this.dragState
      const id = ds.ids[index]
      if (id != null) {
        for (let i = 0; i < e.touches.length; i++) {
          const touch = e.touches[i]
          if (touch.identifier === id) {
            return [touch.pageX, touch.pageY]
          }
        }
      }
      return index === 0 ? [ds.x, ds.y] : [ds.x2, ds.y2]
    },

    // 鼠标按下处理
    onMouseDown(e) {
      if (!this.interactive) return
      if (e.button !== 0) return // 左键按下才算
      if (this.dragState) return // 已在拖拽中则忽略

      // 记录初始位置
      this.dragState = {
        x: e.pageX,
        y: e.pageY
      }

      // 添加全局事件
      const move = e => {
        e.preventDefault()
        this.onMouseMove(e)
      }
      const end = e => {
        const ds = this.dragState
        if (!this.onMouseUp(e)) return
        this.dragState = null
        document.removeEventListener('mousemove', move, CAPTURE)
        document.removeEventListener('mouseup', end, PASSIVE_CAPTURE)
        if (ds.initX == null) {
          this.$emit('click', ...this.pageToViewXY(ds.x, ds.y))
        } else {
          this.$emit('stop-drag')
        }
      }
      document.addEventListener('mousemove', move, CAPTURE)
      document.addEventListener('mouseup', end, PASSIVE_CAPTURE)
    },

    // 鼠标移动处理
    onMouseMove(e) {
      const ds = this.dragState
      const dx = e.pageX - ds.x
      const dy = e.pageY - ds.y

      // 拖拽未达到阀值，则忽略
      if (ds.initX == null) {
        if (!this.overThreshold(dx, dy)) return
        ds.initX = this.viewX
        ds.initY = this.viewY
        this.$emit('start-drag')
      }

      // 更新中心点
      const k = 1 / this.uiZoom / this.viewZoom
      this.updateViewCenter(ds.initX - dx * k, ds.initY - dy * k)
      this.$emit('dragging', this.viewX - ds.initX, this.viewY - ds.initY, 1)
    },

    // 鼠标放开处理
    // - @return 是否结束拖拽
    onMouseUp(e) {
      // 非左键放开也算结束，否则可能会产生粘连
      return true
    },

    // 鼠标滚轮处理
    onMouseWheel(e) {
      if (!this.interactive) return
      const delta = (e.deltaY * ([1, 40, 800][e.deltaMode] || 1)) / 40
      const zoom = this.wheelZoomRate ** -delta
      const [x, y] = this.pageToViewXY(e.pageX, e.pageY)
      this.updateViewZoom(this.viewZoom * zoom, x, y)
    },

    // 触屏开始处理
    onTouchStart(e) {
      if (!this.interactive) return
      if (this.dragState && !this.dragState.ids) return // 已在鼠标拖拽中则忽略

      // 记录第一个触点初始位置
      const isFirst = !this.dragState
      if (isFirst) {
        const touch = e.touches[0]
        this.dragState = {
          x: touch.pageX,
          y: touch.pageY,
          ids: [touch.identifier]
        }
      }

      // 记录第二个触点初始位置（3个及以上的触点忽略）
      const ds = this.dragState
      if (ds.ids.length === 1) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i]
          if (ds.ids.includes(touch.identifier)) continue
          ds.ids.push(touch.identifier)
          ds.x2 = touch.pageX
          ds.y2 = touch.pageY

          // 第一个触点也要重新记录，否则触点初始间距会不准确
          const [x, y] = this.getTouchPageXY(e, 0)
          ds.x = x
          ds.y = y
          if (ds.initX != null) {
            ds.initX = this.viewX
            ds.initY = this.viewY
          }

          // 计算缩放中心和大小
          const [cx, cy] = this.pageToViewXY((x + ds.x2) / 2, (y + ds.y2) / 2)
          ds.zoomX = cx
          ds.zoomY = cy
          ds.zoomSize = Math.hypot(ds.x2 - x, ds.y2 - y)
          break
        }
      }

      // 添加全局事件
      if (isFirst) {
        const move = e => {
          e.preventDefault()
          this.onTouchMove(e)
        }
        const end = e => {
          const ds = this.dragState
          if (!this.onTouchEnd(e)) return
          this.dragState = null
          document.removeEventListener('touchmove', move, CAPTURE)
          document.removeEventListener('touchend', end, PASSIVE_CAPTURE)
          document.removeEventListener('touchcancel', end, PASSIVE_CAPTURE)
          if (ds.initX == null) {
            this.$emit('click', ...this.pageToViewXY(ds.x, ds.y))
          } else {
            this.$emit('stop-drag')
          }
        }
        document.addEventListener('touchmove', move, CAPTURE)
        document.addEventListener('touchend', end, PASSIVE_CAPTURE)
        document.addEventListener('touchcancel', end, PASSIVE_CAPTURE)
      }
    },

    // 触屏移动处理
    onTouchMove(e) {
      if (!this.checkTouchChange(e)) return // 非有效触点移动则忽略
      const ds = this.dragState
      const isZoom = ds.ids.length > 1
      const [x, y] = this.getTouchPageXY(e, 0)
      const [x2, y2] = this.getTouchPageXY(e, 1)
      const dx = x - ds.x
      const dy = y - ds.y
      const dx2 = x2 - ds.x2
      const dy2 = y2 - ds.y2

      // 拖拽未达到阀值，则忽略
      if (ds.initX == null) {
        if (!this.overThreshold(dx, dy) && !(isZoom && this.overThreshold(dx2, dy2))) return
        ds.initX = this.viewX
        ds.initY = this.viewY
        if (isZoom) {
          ds.initZoom = this.viewZoom
        }
        this.$emit('start-drag')
      } else if (isZoom && ds.initZoom == null) {
        if (this.overThreshold(dx, dy) || this.overThreshold(dx2, dy2)) {
          ds.initZoom = this.viewZoom
        }
      }

      // 更新中心点和缩放比率
      const k = 1 / this.uiZoom / this.viewZoom
      if (isZoom) {
        if (ds.initZoom == null) {
          this.updateViewCenter(ds.initX - ((dx + dx2) / 2) * k, ds.initY - ((dy + dy2) / 2) * k)
        } else {
          this.__ignoreRangeLimit = true
          const k = 1 / this.uiZoom / ds.initZoom
          const zoom = Math.hypot(x2 - x, y2 - y) / ds.zoomSize
          this.updateViewCenter(ds.initX - ((dx + dx2) / 2) * k, ds.initY - ((dy + dy2) / 2) * k)
          this.updateViewZoom(ds.initZoom * zoom, ds.zoomX, ds.zoomY, ds.initZoom)
          delete this.__ignoreRangeLimit
          this.refreshViewX()
          this.refreshViewY()
        }
      } else {
        this.updateViewCenter(ds.initX - dx * k, ds.initY - dy * k)
      }
      this.$emit('dragging', this.viewX - ds.initX, this.viewY - ds.initY, ds.initZoom == null ? 1 : this.viewZoom / ds.initZoom)
    },

    // 触屏结束处理
    // - @return 是否结束拖拽
    onTouchEnd(e) {
      const change = this.checkTouchChange(e)
      if (!change) return // 非有效触点放开则忽略

      // 有效触点全放开则结束
      const ds = this.dragState
      if (ds.ids.length < 2 || change === 3) return true

      // 转为单触点拖拽
      const [x, y] = this.getTouchPageXY(e, 2 - change)
      this.dragState = {
        x,
        y,
        ids: [ds.ids[2 - change]],
        ...(ds.initX != null
          ? {
              initX: this.viewX,
              initY: this.viewY
            }
          : {})
      }
    },

    // 触发视区缩放事件
    emitResize() {
      this.$emit('resize', this.viewWidth / this.viewZoom, this.viewHeight / this.viewZoom)
    },

    // 触发视区移动事件
    emitMove() {
      this.$emit('move', this.viewX, this.viewY)
    }
  }
}
</script>
