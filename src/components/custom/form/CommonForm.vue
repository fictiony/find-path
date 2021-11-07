<template>
  <div class="column q-gutter-y-sm">
    <template v-if="form instanceof Array">
      <template v-for="(row, index) in form">
        <div :key="index" class="row" :class="row.$class || rowClass" :style="row.$style || rowStyle" v-if="row">
          <template v-for="(def, field) in row">
            <component
              :key="field"
              :ref="field"
              :is="getInput(def.t || inputParams.t)"
              :value="value[field]"
              v-bind="getCombineParams(def)"
              v-on="{ ...$listeners, input: () => {} }"
              @input="onInput(def, field, $event)"
              v-if="field !== '$class' && field !== '$style'"
            />
          </template>
        </div>
        <q-separator :key="index" v-else />
      </template>
    </template>
    <template v-else>
      <template v-for="(def, field) in form">
        <component
          :key="field"
          :ref="field"
          :is="getInput(def.t || inputParams.t)"
          :value="value[field]"
          :auto-save="autoSave"
          v-bind="getCombineParams(def)"
          v-on="{ ...$listeners, input: () => {} }"
          @input="onInput(def, field, $event)"
          v-if="def"
        />
        <q-separator :key="field" v-else />
      </template>
    </template>
  </div>
</template>

<script>
// 【通用表单】
import { INPUT, NESTED } from 'components/custom/form'

export default {
  props: {
    form: {
      // 表单定义，格式为：{ 字段名: { t: 输入框类型（参见INPUT）, dynamicParams: 动态参数表获取函数（若指定，则需返回动态参数表）,
      // onInput: 输入事件处理函数（参数为：输入值, 输入框组件）, ...输入框组件参数 }, ...其他字段 }
      // 为Array时每项为一个表单定义，且占据一行，且每项表单定义中名为$class和$style的字段改为用于定制该行的样式，而不按常规字段处理
      type: [Object, Array],
      required: true
    },
    value: {
      // 表单数据对象
      type: Object,
      default: () => ({})
    },
    inputParams: {
      // 输入框的统一参数表（其中onInput的输入值参数将自动变为：{ field: 字段名（嵌套时用.分隔）, value: 输入值 }）
      type: Object,
      default: () => ({})
    },
    autoSave: Boolean, // 是否自动保存表单输入值（即无需添加input事件来更新输入值到表单数据字段中）
    rowClass: {
      // 行样式（当form为Array时起效）
      type: [String, Array, Object],
      default: 'q-gutter-x-md'
    },
    rowStyle: [String, Array, Object]
  },

  computed: {
    // 判断是否有取值错误
    hasError() {
      return Object.keys(this.$refs).findIndex(i => this.getField(i).hasError) >= 0
    }
  },

  methods: {
    // 获取输入框组件
    getInput(type) {
      return INPUT[type] || type || INPUT.default
    },

    // 获取指定字段
    getField(field) {
      return this.$refs[field][0]
    },

    // 获取合并后的字段参数表
    getCombineParams(def) {
      const dynamicParams = def.dynamicParams ? def.dynamicParams() : null
      return { ...this.inputParams, ...def, ...dynamicParams, inputParams: { ...this.inputParams, ...def.inputParams } }
    },

    // 矫正嵌套输入字段名和值
    adjustNested(nested, field, value) {
      return nested ? { field: field + '.' + value.field, value: value.value } : { field, value }
    },

    // 输入时处理
    onInput(def, field, value) {
      const nested = NESTED.includes(def.t || this.inputParams.t)
      if (this.autoSave && !nested) {
        const data = this.value // 直接赋值会报props不能直接修改的警告
        data[field] = value
      }
      const nestedValue = this.adjustNested(nested, field, value)
      if (def.onInput) {
        def.onInput(value, this.getField(field))
      } else if (this.inputParams.onInput) {
        this.inputParams.onInput(nestedValue, this)
      }
      this.$emit('input', nestedValue)
    }
  }
}
</script>
