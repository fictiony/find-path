import Vue from 'vue'

// 第三方组件
// import { QEditableTd, QSelectableTd } from 'components/thirdparty/qmodeltd'
// import { MySplitter, MyDrawer } from 'components/thirdparty/plus'
import MyDrawer from 'components/thirdparty/plus/MyDrawer'
// import QLayoutNoScroll from 'components/thirdparty/QLayoutNoScroll'
import CustomScroller from 'components/thirdparty/inspect/CustomScroller'

// 自定义组件
import CustomMenu from 'components/custom/CustomMenu.vue'
import FloatPanel from 'components/custom/FloatPanel.vue'
import FilterableList from 'components/custom/FilterableList.vue'
import ZoomView from 'src/components/custom/ZoomView.vue'
import {
  CommonForm,
  // CommonList,
  // CommonArray,
  CommonBtn,
  CommonCtrl,
  CommonInput,
  // TextInput,
  NumInput
  // FileInput
} from 'components/custom/form'

// 业务功能组件
import EditHint from 'components/EditHint.vue'
import BrushPattern from 'components/BrushPattern.vue'
import BrushCursor from 'components/BrushCursor.vue'
import PointPos from 'components/PointPos.vue'
import MarkLayer from 'components/MarkLayer.vue'

// 注册组件
const components = {
  // QEditableTd,
  // QSelectableTd,
  // MySplitter,
  MyDrawer,
  // QLayoutNoScroll,
  CustomScroller,

  CustomMenu,
  FloatPanel,
  FilterableList,
  ZoomView,

  CommonForm,
  // CommonList,
  // CommonArray,
  CommonBtn,
  CommonCtrl,
  CommonInput,
  // TextInput,
  NumInput,
  // FileInput,

  EditHint,
  BrushPattern,
  BrushCursor,
  PointPos,
  MarkLayer
}
Object.keys(components).forEach(name => {
  Vue.component(components[name].name || name, components[name])
})
