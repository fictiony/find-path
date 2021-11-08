<template>
  <ZoomView ref="view" class="absolute-full" :class="`bg-grey-${$q.dark.isActive ? 9 : 5}`" :zoom.sync="viewZoom"> 视图内容 </ZoomView>
</template>

<script>
// 【主视图区】
import { mapGetters } from 'vuex'
import { mapStateRW } from 'boot/utils'
import key from 'keymaster'

export default {
  data: () => ({}),

  computed: {
    ...mapStateRW('main', ['viewZoom']),
    ...mapGetters('main', ['maxViewZoom', 'minViewZoom'])
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
