<template>
  <FloatPanel title="操作面板" state="operatePanel" :style="{ backgroundColor: $q.dark.isActive ? '#0006' : '#fff6' }">
    <q-scroll-area class="fit column q-px-sm q-py-xs">
      <CommonForm
        class="_form q-pa-sm"
        :form="form"
        :value="_self"
        auto-save
        :input-params="inputParams"
        :hidden-fields="hiddenFields"
        @input="onInput"
      />
      <BrushPattern class="q-mx-sm q-pa-xs float-left" style="background-color: #8881; border: 1px solid #8888; border-radius: 4px" />
    </q-scroll-area>
  </FloatPanel>
</template>

<script>
// 【操作面板】
import { mapState, mapActions } from 'vuex'
import { mapStateRW, B } from 'boot/utils'
import { ALGORITHMS, HEURISTICS, DIAGONAL_MOVES, POINT_MODES, BRUSH_MODES, BRUSH_TYPES } from 'boot/draw'
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
const BTN_PARAMS = { t: 'btn', class: 'q-my-xs q-px-xs', glossy: true }

export default {
  data: vm => ({
    // 操作表单
    form: [
      {
        xGrids: { ...NUM_PARAMS, label: '横向格数', tips: '取值范围：10~10000', defVal: 100, minVal: 10, maxVal: 10000 },
        yGrids: { ...NUM_PARAMS, label: '纵向格数', tips: '取值范围：10~10000', defVal: 100, minVal: 10, maxVal: 10000 },
        gridSize: { ...NUM_PARAMS, label: '格子边长', tips: '取值范围：1~100', defVal: 20, minVal: 1, maxVal: 100, suffix: 'px' },
        clearGrids: { ...BTN_PARAMS, label: '清空', tips: '快捷键：Ctrl+D' }
      },
      null,
      {
        algorithm: {
          ...SELECT_PARAMS,
          label: '算法类型',
          tips: 'html ' + ALGORITHMS.map(i => `<b class="text-yellow">【${i.label}】</b><br>${i.tips}`).join('<br><br>'),
          options: ALGORITHMS
        },
        heuristic: {
          ...SELECT_PARAMS,
          label: '启发函数',
          tips: 'html ' + HEURISTICS.map(i => `<b class="text-yellow">${i.label}：</b>${i.tips}`).join('<br><br>'),
          dynamicParams: () => ({ options: HEURISTICS.filter(i => !(vm.algorithm === 'js_astar' && ['euclidean', 'chebyshev'].includes(i.value))) })
        },
        heuristWeight: {
          ...NUM_PARAMS,
          label: '启发权重',
          tips: ['启发函数值在优先级计算中的权重', '取值范围：0~10000，最大精度：0.01'],
          minVal: 0,
          maxVal: 10000,
          precision: 2
        },
        heapSort: {
          ...TOGGLE_PARAMS,
          label: '采用二叉堆排序',
          tips: '路径长时可显著提升性能'
        },
        diagonalMove: {
          ...SELECT_PARAMS,
          label: '对角移动',
          tips: DIAGONAL_MOVES.map(
            i => `html ${i.label}：<br><img style="padding: 8px; background-color: #fff8" s src="${require('assets/diagonal_' + i.value + '.png')}">`
          ),
          dynamicParams: () => ({ options: DIAGONAL_MOVES.filter(i => !(vm.algorithm === 'js_astar' && [1, 2].includes(i.value))) })
        }
      },
      null,
      {
        showState: {
          ...TOGGLE_PARAMS,
          label: '寻路状态',
          tips: `html${B('■', '#64f064')}- 开启节点<br>${B('■', '#32c8c8')}- 关闭节点<br>${B('■', '#1e78be')}- 路径节点`,
          dynamicParams: () => ({ ctrlParams: { label: vm.showState ? '实时显示' : '不显示' } })
        },
        showDelay: {
          ...NUM_PARAMS,
          label: '显示延时',
          tips: ['每个寻路节点改变状态后要延迟显示的毫秒数', '取值范围：0~1000，最大精度：0.001'],
          minVal: 0,
          maxVal: 1000,
          precision: 3,
          suffix: 'ms'
        }
      },
      {
        pointMode: {
          ...BTN_TOGGLE_PARAMS,
          label: '选起止点',
          tips: POINT_MODES.map(i => `${i.value} - ${i.name}`),
          options: POINT_MODES,
          clearable: true
        },
        clearPoints: { ...BTN_PARAMS, label: '清除', tips: '快捷键：Esc' },
        autoFind: { ...TOGGLE_PARAMS, label: '自动寻路' },
        findPath: {
          ...BTN_PARAMS,
          tips: '快捷键：F9',
          dynamicParams: () => ({
            label: !vm.findingPath ? '开始寻路' : vm.findPaused ? '继续寻路' : '暂停寻路',
            icon: !vm.findingPath || vm.findPaused ? 'play_arrow' : 'pause',
            ...(!vm.startPos || !vm.endPos ? { disable: true, style: 'opacity: 0.3 !important' } : {})
          })
        }
      },
      null,
      {
        brushMode: {
          ...BTN_TOGGLE_PARAMS,
          label: '笔刷模式',
          tips: BRUSH_MODES.map(i => `${i.value} - ${i.name}`),
          options: BRUSH_MODES,
          clearable: true
        },
        brushType: {
          ...BTN_TOGGLE_PARAMS,
          label: '笔刷样式',
          tips: BRUSH_TYPES.map(i => `${i.value} - ${i.name}`),
          options: BRUSH_TYPES
        }
      },
      {
        brushSize: { ...SLIDER_PARAMS, label: '笔刷大小', tips: '取值范围：1~200', min: 1, max: 200 },
        brushSizeTip: { ...BADGE_PARAMS, dynamicParams: () => ({ label: vm.brushSize }) }
      },
      {
        brushSoft: { ...SLIDER_PARAMS, label: '笔刷软度', tips: ['即笔刷边缘障碍程度减弱的快慢', '取值范围：0~100'] },
        brushSoftTip: { ...BADGE_PARAMS, dynamicParams: () => ({ label: vm.brushSoft }) }
      },
      {
        brushState: { ...SLIDER_PARAMS, label: '障碍程度', tips: ['取值范围：1~200', '>100表示绝对阻挡不可通过'], min: 1, max: 200 },
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
    ...mapStateRW('edit', ['xGrids', 'yGrids', 'gridSize', 'findingPath', 'pathDirty']),
    ...mapStateRW('edit', ['algorithm', 'heuristic', 'heuristWeight', 'heapSort', 'diagonalMove']),
    ...mapStateRW('edit', ['showState', 'showDelay', 'pointMode', 'autoFind', 'findPaused']),
    ...mapStateRW('edit', ['brushMode', 'brushType', 'brushSize', 'brushSoft', 'brushState']),

    // 要隐藏的字段
    hiddenFields() {
      return {
        heuristic: ['dijkstra', 'breadthfirst'].includes(this.algorithm),
        heuristWeight: this.algorithm !== 'bestfirst',
        heapSort: ['breadthfirst', 'js_astar'].includes(this.algorithm),
        showDelay: !this.showState
      }
    }
  },

  methods: {
    ...mapActions('edit', ['clearGrids', 'clearPoints', 'findPath']),

    // 输入处理
    onInput({ field }) {
      switch (field) {
        case 'xGrids':
        case 'yGrids':
          this.clearGrids(true)
          break
        case 'clearGrids':
          this.clearGrids()
          break
        case 'showState':
          this.pathDirty = 'all'
          break
        case 'clearPoints':
          this.clearPoints()
          break
        case 'findPath':
          if (this.findingPath) {
            this.findPaused = !this.findPaused
          } else {
            this.findPath()
          }
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
