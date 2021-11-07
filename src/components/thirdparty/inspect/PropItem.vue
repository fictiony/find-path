<template>
  <tr>
    <td class="_prop ellipsis" :class="nameColor" @dblclick="clickPropName">
      {{ name }}
      <q-icon class="float-right" name="info_outline" v-if="api.required || api.sync" />
      <q-tooltip max-width="400px" anchor="top left" self="top right" :hide-delay="pinTooltip ? 99999999 : 0" ref="tooltip">
        <div>
          <span class="text-h6">{{ name }}</span>
          <q-btn
            flat
            round
            dense
            class="float-right all-pointer-events"
            style="margin-top: -8px; margin-right: -12px"
            icon="close"
            size="xs"
            v-if="pinTooltip"
            @click="closeTooltip"
          />
          <q-badge class="q-ml-md float-right" rounded color="green" label="新增" v-if="isNew" />
          <q-badge class="q-ml-md float-right" rounded color="red" label="更新" v-if="isUpdate" />
        </div>

        <q-separator spaced="5px" color="grey" />
        <div>
          <q-badge class="q-mr-sm" color="accent" label="类型" />
          {{ type }}
        </div>

        <q-separator spaced="3px" color="transparent" />
        <q-markdown class="q-ma-none all-pointer-events" :src="description || '暂无说明'" />

        <div v-if="hasDefault">
          <q-badge class="q-mr-sm" color="secondary" label="默认值" />
          {{ defaultDesc || defaultStr }}
        </div>
      </q-tooltip>
    </td>

    <component
      :is="editorTd"
      ref="editor"
      class="_value"
      :class="editable ? '' : $q.dark.isActive ? 'bg-brown-10' : 'bg-orange-1'"
      popup-content-style="font-size: 13px"
      auto-save
      v-model="editValue"
      v-bind="editorParams"
    >
      <div class="ellipsis" v-if="value !== undefined">{{ valueStr }}</div>
      <div class="ellipsis" :class="$q.dark.isActive ? 'text-grey-7' : 'text-grey-5'" v-else>{{ defaultStr }}</div>
    </component>
  </tr>
</template>

<script>
// 【属性列表项】
import { QTd } from 'quasar'
import { QEditableTd, QSelectableTd } from 'components/thirdparty/qmodeltd'

export default {
  name: 'PropItem',

  data: () => ({
    pinTooltip: false
  }),

  props: {
    instance: {},
    name: {
      type: String,
      required: true
    },
    api: {
      required: true
    },
    value: {
      required: true
    },
    type: {
      type: String,
      default: 'Any'
    },
    editType: {
      type: String,
      default: 'String'
    },
    validator: {
      type: Function,
      default: () => true
    },
    default: {},
    defaultDesc: String,
    description: String,
    isNew: {
      type: Boolean,
      default: false
    },
    isUpdate: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    // 属性名颜色
    nameColor() {
      return [`text-${this.isNew ? 'green' : this.isUpdate ? 'red' : 'primary'}`, this.$q.dark.isActive ? 'bg-blue-grey-10' : 'bg-blue-1']
    },

    // 属性值显示字符串
    valueStr() {
      return this.stringify(this.value)
    },

    // 是否有默认值
    hasDefault() {
      return this.defaultDesc || this.default !== undefined
    },

    // 默认值显示字符串
    defaultStr() {
      return this.stringify(this.default)
    },

    // 是否可编辑
    editable() {
      switch (this.editType) {
        case 'String':
        case 'Number':
        case 'Boolean':
          return true
      }
      return false
    },

    // 单元格编辑元件
    editorTd() {
      switch (this.editType) {
        case 'String':
        case 'Number':
          if (this.api.values) return QSelectableTd
          return QEditableTd
        case 'Boolean':
          return QSelectableTd
      }
      return QTd
    },

    // 编辑参数
    editorParams() {
      switch (this.editType) {
        case 'String':
        case 'Number':
          if (this.api.values) {
            return {
              options: this.api.values,
              inline: true
            }
          }
          return {
            placeholder: this.defaultStr,
            inline: true
          }
        case 'Boolean':
          return {
            options: ['true', 'false'],
            inline: true
          }
      }
      return {}
    },

    // 编辑值
    editValue: {
      get() {
        return this.valueStr
      },
      set(val) {
        this.instance.$forceSet(this.name, this.parse(val))
      }
    }
  },

  methods: {
    // 属性值转字符串
    stringify(val) {
      if (val === undefined) return ''
      switch (this.editType) {
        case 'String':
        case 'Number':
          return String(val)
        case 'Boolean':
          return val === null ? 'null' : String(!!val)
      }
      if (val instanceof Function) return '<Function>'
      if (typeof val === 'object') return JSON.stringify(val, null, 1)
      return String(val)
    },

    // 字符串转属性值
    parse(val) {
      try {
        switch (this.editType) {
          case 'String':
            return val
          case 'Number':
            return Number(val) || 0
          case 'Boolean':
            return val === 'true'
        }
        return JSON.parse(val)
      } catch (e) {
        return null
      }
    },

    // 点击属性名
    clickPropName() {
      this.pinTooltip = !this.pinTooltip
      this.$refs.tooltip.show()
    },

    // 关闭工具提示
    closeTooltip() {
      this.pinTooltip = false
      this.$refs.tooltip.hide()
    }
  }
}
</script>

<style lang="scss" scoped>
$field-height: 27px;
tr ::v-deep ._value .inline-edit-container {
  margin: -4px -8px;
  overflow: hidden;
  .q-field--dense {
    .q-field__control,
    .q-field__native {
      min-height: $field-height;
    }
    .q-field__control,
    .q-field__marginal {
      height: $field-height;
    }
  }
  input.q-field__native {
    margin: 0px 8px;
  }
  div.q-field__native {
    margin: -1px 0px 0px 8px;
  }
}
</style>
