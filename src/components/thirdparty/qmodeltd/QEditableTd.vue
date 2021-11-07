<template>
  <q-model-td
    v-bind="$attrs"
    v-on="{ ...$listeners, input: () => {} }"
    v-model="editValue"
    :inline="inline"
    :auto-save="autoSave"
    @edit-start="onEditStart"
    @edit-finish="onEditFinish"
    @edit-cancel="onEditCancel"
  >
    <template #default>
      <slot />
    </template>

    <template v-slot:model-view="{ input, save, cancel }">
      <q-input
        ref="input"
        autofocus
        dense
        v-bind="$attrs"
        :value="editValue"
        @input="input"
        @blur="inline && (autoSave ? save() : cancel())"
        @keyup.native.enter="save"
      />
    </template>
  </q-model-td>
</template>

<script>
import { QInput } from 'quasar'
import QModelTd from './QModelTd'
import mixin from './mixin'
import mixin2 from './mixin2'

export default {
  name: 'QEditableTd',
  inheritAttrs: false,

  components: {
    QInput,
    QModelTd
  },

  mixins: [mixin, mixin2],

  methods: {
    onEditStart() {
      if (this.inline) {
        this.$nextTick(this.$refs.input.focus)
      }
    }
  }
}
</script>
