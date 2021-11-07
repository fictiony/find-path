import Vue from 'vue'

// 第三方组件
// import { QEditableTd, QSelectableTd } from 'components/thirdparty/qmodeltd'
// import { MySplitter, MyDrawer } from 'components/thirdparty/plus'
// import QLayoutNoScroll from 'components/thirdparty/QLayoutNoScroll'

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
  // CommonCtrl,
  CommonInput
  // TextInput,
  // NumInput,
  // FileInput
} from 'components/custom/form'

// 业务功能组件

// 注册组件
const components = {
  // QEditableTd,
  // QSelectableTd,
  // MySplitter,
  // MyDrawer,
  // QLayoutNoScroll,

  CustomMenu,
  FloatPanel,
  FilterableList,
  ZoomView,

  CommonForm,
  // CommonList,
  // CommonArray,
  CommonBtn,
  // CommonCtrl,
  CommonInput
  // TextInput,
  // NumInput,
  // FileInput,
}
Object.keys(components).forEach(name => {
  Vue.component(components[name].name || name, components[name])
})
