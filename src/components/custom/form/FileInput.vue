<template>
  <CommonInput ref="input" :autogrow="multiSelect" v-bind="$attrs" v-on="$listeners" :qInputStyle="combineInputStyle">
    <q-btn dense flat class="q-ml-xs text-primary" icon="folder_open" v-bind="btnParams" @click="onSelect" />
    <slot />
  </CommonInput>
</template>

<script>
// 【通用文件路径输入框】
import { exposeChildProps, exposeChildMethods } from 'boot/utils'
import { ALL_FILE_FILTERS } from 'boot/filefilters'

export default {
  inheritAttrs: false,

  props: {
    qInputStyle: Object, // 输入框组件样式
    folder: Boolean, // 是否为选择目录
    multiSelect: Boolean, // 是否多选
    forSave: Boolean, // 是否用于保存（为真时将忽略folder和multiSelect属性）
    btnParams: Object, // 选择按钮参数
    dlgParams: Object // 选择对话框参数
  },

  computed: {
    ...exposeChildProps('input', ['focused', 'hasRules', 'hasError']),

    // 合并后的输入框样式
    combineInputStyle() {
      return { flexGrow: 1, ...this.qInputStyle }
    }
  },

  methods: {
    ...exposeChildMethods('input', ['blur', 'focus', 'resetValidation', 'select', 'validate']),

    // 选择按钮点击处理
    async onSelect() {
      const { canceled = true, filePath, filePaths } =
        (await this.$dlgPost(this.forSave ? 'showSaveDialog' : 'showOpenDialog', {
          title: this.folder && !this.forSave ? '选择目录' : '选择文件',
          defaultPath: this.multiSelect && !this.forSave ? (this.$refs.input.value || '').split('\n')[0] : this.$refs.input.value,
          filters: ALL_FILE_FILTERS,
          properties: this.forSave ? [] : [this.folder ? 'openDirectory' : 'openFile', ...(this.multiSelect ? ['multiSelections'] : [])],
          ...this.dlgParams
        })) || {}
      if (canceled) return
      this.$refs.input.onInput(this.forSave ? filePath : this.multiSelect ? filePaths.join('\n') : filePaths[0])
      this.$refs.input.onEnter()
    }
  }
}
</script>
