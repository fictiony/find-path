import CommonForm from './CommonForm.vue'
// import CommonList from './CommonList.vue'
// import CommonArray from './CommonArray.vue'
import CommonBtn from './CommonBtn.vue'
import CommonCtrl from './CommonCtrl.vue'
import CommonInput from './CommonInput.vue'
// import TextInput from './TextInput.vue'
import NumInput from './NumInput.vue'
// import FileInput from './FileInput.vue'

export {
  CommonForm,
  // CommonList,
  // CommonArray,
  CommonBtn,
  CommonCtrl,
  CommonInput,
  // TextInput,
  NumInput
  // FileInput
}

// 输入框类型对应组件表
export const INPUT = {
  form: CommonForm,
  // list: CommonList,
  // array: CommonArray,
  btn: CommonBtn,
  ctrl: CommonCtrl,
  // text: TextInput,
  num: NumInput,
  // file: FileInput,
  default: CommonInput
}

// 嵌套输入框类型
export const NESTED = ['form', 'list', 'array']
