<template>
  <FloatPanel title="操作面板" state="operatePanel" :style="{ backgroundColor: $q.dark.isActive ? '#0006' : '#fff6' }">
    <q-scroll-area class="fit column q-px-sm q-py-xs">
      <CommonForm class="q-pa-sm" :form="form" :value="_self" auto-save :input-params="inputParams" @input="onInput" />
      <BrushPattern class="q-mx-sm q-pa-xs float-left" style="background-color: #8881; border: 1px solid #8888; border-radius: 4px" />
    </q-scroll-area>
  </FloatPanel>
</template>

<script>
// 【操作面板】
import { mapActions } from 'vuex'
import { mapStateRW } from 'boot/utils'
import { BRUSH_MODES, BRUSH_TYPES } from 'boot/draw'
import { QBtnToggle, QBadge, QSlider } from 'quasar'

export default {
  data: vm => ({
    // 操作表单
    form: [
      {
        xGrids: { t: 'num', label: '横向格数', defVal: 100, minVal: 10, maxVal: 10000, width: 80 },
        yGrids: { t: 'num', label: '纵向格数', defVal: 100, minVal: 10, maxVal: 10000, width: 80 },
        gridSize: { t: 'num', label: '格子边长', defVal: 20, minVal: 1, maxVal: 100, width: 60 }
      },
      {
        brushMode: {
          t: 'ctrl',
          label: '笔刷模式',
          tips: BRUSH_MODES.map(i => `${i.value}-${i.name}`).join(' / '),
          component: QBtnToggle,
          options: BRUSH_MODES,
          clearable: true
        },
        brushType: {
          t: 'ctrl',
          label: '笔刷样式',
          tips: BRUSH_TYPES.map(i => `${i.value}-${i.name}`).join(' / '),
          component: QBtnToggle,
          options: BRUSH_TYPES
        }
      },
      {
        brushSize: { t: 'ctrl', label: '笔刷大小', ctrlClass: 'q-ml-sm', component: QSlider, width: 100, min: 1, max: 200, snap: true },
        brushSizeTip: { t: QBadge, dynamicParams: () => ({ label: vm.brushSize }) }
      },
      {
        brushSoft: {
          t: 'ctrl',
          label: '笔刷软度',
          tips: '即笔刷边缘障碍程度减弱的快慢',
          ctrlClass: 'q-ml-sm',
          component: QSlider,
          width: 100,
          snap: true
        },
        brushSoftTip: { t: QBadge, dynamicParams: () => ({ label: vm.brushSoft }) }
      },
      {
        brushState: {
          t: 'ctrl',
          label: '障碍程度',
          tips: '>100表示绝对阻挡不可通过',
          ctrlClass: 'q-ml-sm',
          component: QSlider,
          width: 100,
          min: 1,
          max: 200,
          snap: true
        },
        brushStateTip: { t: QBadge, dynamicParams: () => ({ label: vm.brushState }) }
      }
    ],
    // 表单字段默认参数
    inputParams: {
      glossy: true,
      dense: true,
      standout: true,
      qInputStyle: { marginTop: '2px', marginBottom: '2px' },
      ctrlStyle: { marginTop: '2px', marginBottom: '2px' }
    }
  }),

  computed: {
    ...mapStateRW('edit', ['xGrids', 'yGrids', 'gridSize', 'brushMode', 'brushType', 'brushSize', 'brushSoft', 'brushState'])
  },

  methods: {
    ...mapActions('edit', ['clearGrids']),

    // 输入处理
    onInput({ field, value }) {
      // console.log(field, value)
      switch (field) {
        case 'xGrids':
        case 'yGrids':
          this.clearGrids()
          break
      }
    }
  }
}
</script>
