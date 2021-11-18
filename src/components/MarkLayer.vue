<template>
  <div class="absolute">
    <PointPos v-bind="startPos" :radius="pointRadius" color="#09f" :thick="pointThick" stacks="3" animate="out" duration="2" v-if="startPos" />
    <PointPos v-bind="endPos" :radius="pointRadius" color="#f22" :thick="pointThick" stacks="3" animate="in" duration="2" v-if="endPos" />
  </div>
</template>

<script>
// 【标记图层】
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState('edit', ['gridSize', 'startPos', 'endPos']),

    // 点位半径
    pointRadius() {
      return 20 * this.gridSize ** 0.2
    },

    // 点位圈粗细
    pointThick() {
      return this.pointRadius / 6
    }
  }
}
</script>
