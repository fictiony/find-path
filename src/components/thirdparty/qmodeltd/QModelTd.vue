<template>
  <q-td @click.native="onTdClick" @keyup.native.esc="onCancel">
    <div v-show="!inline || editing === false">
      <slot />
    </div>
    <template v-if="inline">
      <div class="inline-edit-container" v-show="editing !== false">
        <slot name="model-view" v-bind="{ input: onInput, save: onSave, cancel: onCancel }" />
      </div>
    </template>
    <q-popup-edit v-else v-bind="$attrs" :value="value" :auto-save="autoSave" @input="onInput" @save="onSave" @cancel="onCancel">
      <template v-slot="{ emitValue, set, cancel }">
        <slot name="model-view" v-bind="{ input: emitValue, save: set, cancel }"></slot>
      </template>
    </q-popup-edit>
  </q-td>
</template>

<script>
import { QTd, QPopupEdit } from 'quasar'
import mixin from './mixin'

export default {
  name: 'QModelTd',
  inheritAttrs: false,

  components: {
    QTd,
    QPopupEdit
  },

  mixins: [mixin],

  data() {
    return {
      editing: false,
      initialValue: undefined
    }
  },

  methods: {
    onTdClick() {
      if (this.editing !== false) return
      this.initialValue = this.value
      this.editing = true
      this.$emit('edit-start')
    },
    onSave() {
      if (this.editing !== true) return
      this.editing = null
      this.$emit('edit-finish')
      setTimeout(() => {
        this.editing = false // 延后设置防止显示值闪烁
      }, 200)
    },
    onCancel() {
      if (this.editing !== true) return
      if (this.value !== this.initialValue) {
        this.onInput(this.initialValue)
      }
      this.$emit('edit-cancel')
      this.editing = false
    }
  }
}
</script>

<style lang="scss" scoped>
.inline-edit-container ::v-deep .q-field {
  font-size: 13px;
  .q-field__native {
    letter-spacing: 0;
  }
}
</style>
