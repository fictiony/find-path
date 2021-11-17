<template>
  <svg class="absolute no-pointer-events" :width="size" :height="size" :style="pointStyle">
    <circle :cx="radius + thick" :cy="radius + thick" :stroke="color" :stroke-width="thick" fill="#0000">
      <template v-if="animate === 'in'">
        <animate attributeName="r" attributeType="XML" :from="radius" to="0" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" attributeType="XML" from="0.2" to="1" dur="1s" repeatCount="indefinite" />
      </template>
      <template v-if="animate === 'out'">
        <animate attributeName="r" attributeType="XML" from="0" :to="radius" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" attributeType="XML" from="1" to="0" dur="1s" repeatCount="indefinite" />
      </template>
    </circle>
  </svg>
</template>

<script>
// 【点位标记】
import { mapState } from 'vuex'

export default {
  props: {
    x: {
      // X坐标
      type: Number,
      default: 0
    },
    y: {
      // Y坐标
      type: Number,
      default: 0
    },
    radius: {
      // 半径大小
      type: Number,
      default: 10
    },
    color: {
      // 外圈颜色
      type: String,
      default: '#f00'
    },
    thick: {
      // 外圈粗细
      type: Number,
      default: 1
    },
    animate: String // 动画效果：in-光圈汇聚/out-光圈扩散
  },

  computed: {
    ...mapState('main', ['viewZoom']),
    ...mapState('edit', ['gridSize']),

    // 整体大小
    size() {
      return (this.radius + this.thick) * 2
    },

    // 点位样式
    pointStyle() {
      return {
        left: (this.x + 0.5) * this.gridSize + 'px',
        top: (this.y + 0.5) * this.gridSize + 'px',
        transform: this.$makeTransform(this.viewZoom ** -0.5, 0, [0.5, 0.5])
      }
    }
  }
}
</script>
