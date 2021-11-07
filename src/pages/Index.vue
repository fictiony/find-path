<template>
  <ZoomView ref="view" class="absolute-full" :class="`bg-grey-${$q.dark.isActive ? 9 : 5}`"> 视图内容 </ZoomView>
</template>

<script>
// 【主视图区】
import key from 'keymaster'

export default {
  data: () => ({}),

  mounted() {
    if (process.env.DEBUGGING) {
      window.$m = this
    }

    // 绑定快捷键
    key.setScope('main')
  }
}
</script>
