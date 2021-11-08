<template>
  <svg class="absolute-center" :width="halfGridWidth * 2" :height="halfGridHeight * 2">
    <template v-for="i in xGrids">
      <template v-for="j in yGrids">
        <rect
          :key="i + (j - 1) * xGrids"
          :x="(i - 1) * gridSize"
          :y="(j - 1) * gridSize"
          :width="gridSize"
          :height="gridSize"
          :fill="'#' + $randint(0x111, 0xfff).toString(16)"
        />
      </template>
    </template>
  </svg>
</template>

<script>
// 【网格图】
import { mapState, mapGetters } from 'vuex'

export default {
  computed: {
    ...mapState('edit', ['xGrids', 'yGrids', 'gridSize']),
    ...mapGetters('edit', ['halfGridWidth', 'halfGridHeight'])
  }
}
</script>
