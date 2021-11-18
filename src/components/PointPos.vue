<template>
  <svg class="absolute no-pointer-events" :width="size" :height="size" :style="pointStyle">
    <circle
      v-for="i in +stacks"
      :key="i"
      :cx="radius + thick"
      :cy="radius + thick"
      :r="(radius * i) / stacks"
      :stroke="color"
      :stroke-width="thick"
      fill="#0000"
      :opacity="animate ? 0 : 1 - (i - 1) / stacks"
    >
      <template v-if="animate">
        <animate
          attributeName="r"
          attributeType="XML"
          :from="animate === 'in' ? radius : 0"
          :to="animate === 'in' ? 0 : radius"
          :dur="duration + 's'"
          :begin="duration * ((i - 1) / stacks) + 's'"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          attributeType="XML"
          :from="animate === 'in' ? 0 : 1"
          :to="animate === 'in' ? 1 : 0"
          :dur="duration + 's'"
          :begin="duration * ((i - 1) / stacks) + 's'"
          repeatCount="indefinite"
        />
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
    stacks: {
      // 堆叠数
      type: [Number, String],
      default: 1
    },
    animate: {
      // 动画效果：in-光圈汇聚/out-光圈扩散/其他-无
      type: String,
      default: ''
    },
    duration: {
      // 动画时长（秒）
      type: [Number, String],
      default: 1
    }
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
