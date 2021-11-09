<template>
  <svg class="absolute-center" :width="halfGridWidth * 2" :height="halfGridHeight * 2">
    <template v-if="show">
      <template v-for="x in xGrids">
        <template v-for="y in yGrids">
          <rect
            :key="x + (y - 1) * xGrids"
            :x="(x - 1) * gridSize"
            :y="(y - 1) * gridSize"
            :width="gridSize"
            :height="gridSize"
            :fill="getColor(x, y)"
          />
        </template>
      </template>
    </template>
  </svg>
</template>

<script>
// 【网格图】
import { mapState, mapGetters } from 'vuex'

export default {
  props: {
    show: {
      type: Boolean,
      default: true
    }
  },

  computed: {
    ...mapState('edit', ['xGrids', 'yGrids', 'gridSize']),
    ...mapGetters('edit', ['halfGridWidth', 'halfGridHeight'])
  },

  methods: {
    getColor(x, y) {
      return '#' + this.$randint(0x111, 0xfff).toString(16)
    }
  }
}
</script>
