<template>
  <div class="absolute">
    <PointPos v-bind="startPos" :radius="gridSize" color="#09f" :thick="gridSize / 5" stacks="3" animate="out" duration="2" v-if="startPos" />
    <PointPos v-bind="endPos" :radius="gridSize" color="#f22" :thick="gridSize / 5" stacks="3" animate="in" duration="2" v-if="endPos" />
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
