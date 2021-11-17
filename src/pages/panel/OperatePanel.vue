<template>
  <FloatPanel title="操作面板" state="operatePanel" :style="{ backgroundColor: $q.dark.isActive ? '#0006' : '#fff6' }">
    <q-scroll-area class="fit column q-px-sm q-py-xs">
      <CommonForm class="_form q-pa-sm" :form="form" :value="_self" auto-save :input-params="inputParams" @input="onInput" @click="$log" />
      <BrushPattern class="q-mx-sm q-pa-xs float-left" style="background-color: #8881; border: 1px solid #8888; border-radius: 4px" />
    </q-scroll-area>
  </FloatPanel>
</template>

<script>
// 【操作面板】
import { mapState, mapActions } from 'vuex'
import { mapStateRW } from 'boot/utils'
import { ALGORITHMS, DIAGONAL_MOVES, POINT_MODES, BRUSH_MODES, BRUSH_TYPES } from 'boot/draw'
import { QBtnToggle, QBadge, QSlider, QSelect, QToggle } from 'quasar'

// 表单控件固定参数
const NUM_PARAMS = { t: 'num', standout: true, width: 80 }
const BTN_TOGGLE_PARAMS = { t: 'ctrl', component: QBtnToggle, glossy: true }
const SLIDER_PARAMS = { t: 'ctrl', component: QSlider, class: 'q-space', ctrlClass: 'q-ml-sm q-space', width: 50, snap: true }
const BADGE_PARAMS = { t: QBadge, style: 'width: 34px', outline: true, color: 'grey-7' }
const SELECT_PARAMS = {
  t: 'ctrl',
  component: QSelect,
  class: 'q-space ellipsis',
  ctrlClass: 'q-space',
  width: 120,
  standout: true,
  optionsDense: true,
  emitValue: true,
  mapOptions: true
}
const TOGGLE_PARAMS = { t: 'ctrl', component: QToggle, ctrlStyle: { marginTop: '6px', marginBottom: '6px' } }
const BTN_PARAMS = { t: 'btn', class: 'q-px-xs', push: true }

export default {
  data: vm => ({
    // 操作表单
    form: [
      {
        xGrids: { ...NUM_PARAMS, label: '横向格数', defVal: 100, minVal: 10, maxVal: 10000 },
        yGrids: { ...NUM_PARAMS, label: '纵向格数', defVal: 100, minVal: 10, maxVal: 10000 },
        gridSize: { ...NUM_PARAMS, label: '格子边长', defVal: 20, minVal: 1, maxVal: 100, suffix: 'px' }
      },
      {
        algorithm: { ...SELECT_PARAMS, label: '算法类型', options: ALGORITHMS },
        diagonalMove: { ...SELECT_PARAMS, label: '对角移动', options: DIAGONAL_MOVES }
      },
      {
        showState: { ...TOGGLE_PARAMS, label: '寻路状态', dynamicParams: () => ({ ctrlParams: { label: vm.showState ? '实时显示' : '不显示' } }) },
        showDelay: { ...NUM_PARAMS, label: '显示延时', minVal: 0, maxVal: 1000, suffix: 'ms' }
      },
      {
        pointMode: {
          ...BTN_TOGGLE_PARAMS,
          label: '选起止点',
          tips: POINT_MODES.map(i => `${i.value}-${i.name}`).join(' / '),
          class: 'q-mr-xs',
          options: POINT_MODES,
          clearable: true
        },
        clearPoints: { ...BTN_PARAMS, label: '清除' },
        findPath: {
          ...BTN_PARAMS,
          label: '寻路', // 暂停、继续
          dynamicParams: () => (!vm.startPos || !vm.endPos ? { disable: true, style: 'opacity: 0.3 !important' } : {})
        },
        $class: 'q-gutter-x-xs'
      },
      {
        brushMode: {
          ...BTN_TOGGLE_PARAMS,
          label: '笔刷模式',
          tips: BRUSH_MODES.map(i => `${i.value}-${i.name}`).join(' / '),
          options: BRUSH_MODES,
          clearable: true
        },
        brushType: {
          ...BTN_TOGGLE_PARAMS,
          label: '笔刷样式',
          tips: BRUSH_TYPES.map(i => `${i.value}-${i.name}`).join(' / '),
          options: BRUSH_TYPES
        }
      },
      {
        brushSize: { ...SLIDER_PARAMS, label: '笔刷大小', min: 1, max: 200 },
        brushSizeTip: { ...BADGE_PARAMS, dynamicParams: () => ({ label: vm.brushSize }) }
      },
      {
        brushSoft: { ...SLIDER_PARAMS, label: '笔刷软度', tips: '即笔刷边缘障碍程度减弱的快慢' },
        brushSoftTip: { ...BADGE_PARAMS, dynamicParams: () => ({ label: vm.brushSoft }) }
      },
      {
        brushState: { ...SLIDER_PARAMS, label: '障碍程度', tips: '>100表示绝对阻挡不可通过', min: 1, max: 200 },
        brushStateTip: { ...BADGE_PARAMS, dynamicParams: () => ({ label: vm.brushState }) }
      }
    ],
    // 表单字段默认参数
    inputParams: {
      dense: true,
      qInputStyle: { marginTop: '2px', marginBottom: '2px' },
      ctrlStyle: { marginTop: '2px', marginBottom: '2px' }
    }
  }),

  computed: {
    ...mapState('edit', ['startPos', 'endPos']),
    ...mapStateRW('edit', ['xGrids', 'yGrids', 'gridSize', 'algorithm', 'diagonalMove', 'showState', 'showDelay', 'pointMode']),
    ...mapStateRW('edit', ['brushMode', 'brushType', 'brushSize', 'brushSoft', 'brushState'])
  },

  methods: {
    ...mapActions('edit', ['clearGrids', 'clearPoints', 'findPath']),

    // 输入处理
    onInput({ field, value }) {
      console.log(field)
      switch (field) {
        case 'xGrids':
        case 'yGrids':
          this.clearGrids()
          break
        case 'clearPoints':
          this.clearPoints()
          break
        case 'findPath':
          this.findPath()
          break
      }
    }
  }
}
</script>

<style lang="scss" scoped>
._form ::v-deep .q-select .q-field__inner {
  .q-field__control,
  .q-field__native {
    min-height: 32px;
    overflow: hidden;
  }
}
</style>
