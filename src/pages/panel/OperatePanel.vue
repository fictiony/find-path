<template>
  <FloatPanel title="操作面板" state="operatePanel">
    <q-scroll-area class="fit column q-px-sm q-py-xs">
      <CommonForm class="q-pa-sm" :form="form" :value="_self" auto-save :input-params="inputParams" @input="onInput" />
    </q-scroll-area>
  </FloatPanel>
</template>

<script>
// 【操作面板】
// import { mapState, mapActions } from 'vuex'
import { mapStateRW } from 'boot/utils'

export default {
  data: vm => ({
    // 操作表单
    form: [
      {
        xGrids: { t: 'num', label: '横向格数', minVal: 10, maxVal: 10000, width: 80 },
        yGrids: { t: 'num', label: '纵向格数', minVal: 10, maxVal: 10000, width: 80 },
        gridSize: { t: 'num', label: '格子边长', minVal: 1, maxVal: 100, width: 60 }
      }
    ],
    // 表单字段默认参数
    inputParams: {
      t: 'btn',
      glossy: true,
      outlined: true,
      standout: true
    }
  }),

  computed: {
    ...mapStateRW('edit', ['xGrids', 'yGrids', 'gridSize'])
  },

  methods: {
    // 输入处理
    onInput({ field, value }) {
      console.log(field, value)
    }
  }
}
</script>
