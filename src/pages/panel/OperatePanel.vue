<template>
  <FloatPanel title="操作面板" :can-float="false" state="operatePanel">
    <q-scroll-area class="fit column q-px-sm q-py-xs">
      <CommonForm class="q-pa-sm" :form="form" :value="_self" row-class="q-gutter-x-sm" :input-params="inputParams" @input="onInput" />
    </q-scroll-area>
  </FloatPanel>
</template>

<script>
// 【操作面板】
import { mapState, mapActions } from 'vuex'

export default {
  data: vm => ({
    // 操作表单
    form: [
      {
        zoomIn: { tips: '放大', icon: 'zoom_in' },
        zoomOut: { tips: '缩小', icon: 'zoom_out' },
        zoomOne: { tips: '1:1 缩放', icon: '1x_mobiledata' }
      }
    ],
    // 表单字段默认参数
    inputParams: {
      t: 'btn',
      glossy: true
    }
  }),

  computed: {
    ...mapState('main', ['viewZoom'])
  },

  methods: {
    ...mapActions('main', ['zoomView']),

    // 输入处理
    onInput({ field, value }) {
      switch (field) {
        case 'zoomIn':
          return this.zoomView(this.viewZoom * Math.SQRT2)
        case 'zoomOut':
          return this.zoomView(this.viewZoom * Math.SQRT1_2)
        case 'zoomOne':
          return this.zoomView(1)
      }
    }
  }
}
</script>
