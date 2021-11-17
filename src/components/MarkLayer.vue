<template>
  <div class="absolute">
    <PointPos v-bind="startPos" :radius="gridSize" color="#2bf" :thick="gridSize / 5" animate="out" v-if="startPos" />
    <PointPos v-bind="endPos" :radius="gridSize" color="#f22" :thick="gridSize / 5" animate="in" v-if="endPos" />
  </div>
</template>

<script>
// 【标记图层】
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState('edit', ['gridSize', 'startPos', 'endPos'])
  }
}
</script>
