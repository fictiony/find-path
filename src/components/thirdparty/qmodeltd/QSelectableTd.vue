<template>
  <q-model-td
    v-bind="$attrs"
    v-on="{ ...$listeners, input: () => {} }"
    v-model="editValue"
    :inline="inline"
    :auto-save="autoSave"
    :disable="disable"
    @edit-start="onEditStart"
    @edit-finish="onEditFinish"
    @edit-cancel="onEditCancel"
  >
    <template #default>
      <slot />
    </template>

    <template v-slot:model-view="{ input, save, cancel }">
      <q-select
        ref="select"
        autofocus
        dense
        options-dense
        v-bind="$attrs"
        :value="editValue"
        :disable="disable || initalDisable"
        @input="input($event) || (inline && save())"
        @blur="inline && (autoSave ? save() : cancel())"
        @keyup.native.enter="save"
        @click.native.stop
      />
    </template>
  </q-model-td>
</template>

<script>
import { QSelect } from 'quasar'
import QModelTd from './QModelTd'
import mixin from './mixin'
import mixin2 from './mixin2'

export default {
  name: 'QSelectableTd',
  inheritAttrs: false,

  components: {
    QSelect,
    QModelTd
  },

  mixins: [mixin, mixin2],

  data: () => ({
    initalDisable: true // 初始禁用编辑（用于修复初始会莫名其妙激活菜单的bug）
  }),

  props: {
    disable: Boolean // 禁用编辑
  },

  methods: {
    onEditStart() {
      setTimeout(() => this.$nextTick(this.$refs.select.showPopup))
    }
  },

  mounted() {
    this.initalDisable = false
  }
}
</script>
