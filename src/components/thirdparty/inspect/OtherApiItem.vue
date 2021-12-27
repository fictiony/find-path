<template>
  <tr>
    <td class="_prop ellipsis" :class="categoryColor">
      {{ categoryName }}
    </td>

    <td class="_value ellipsis" :class="apiColor" @dblclick="clickApiName">
      {{ apiName }}
      <q-tooltip
        content-class="all-pointer-events"
        max-width="400px"
        anchor="top left"
        self="top right"
        :hide-delay="pinTooltip ? 99999999 : 0"
        ref="tooltip"
      >
        <div>
          <span class="text-h6">{{ categoryName }}：{{ name }}</span>
          <q-btn
            flat
            round
            dense
            class="float-right"
            style="margin-top: -8px; margin-right: -12px"
            icon="close"
            size="xs"
            v-if="pinTooltip"
            @click="closeTooltip"
          />
        </div>

        <q-separator spaced="5px" color="grey" />

        <template v-if="type">
          <div>
            <q-badge class="q-mr-sm" color="accent" label="类型" />
            {{ type }}
          </div>
          <q-separator spaced="3px" color="transparent" />
        </template>

        <q-markdown class="q-ma-none" :src="description || '暂无说明'" />

        <div v-if="defaultDesc">
          <q-badge class="q-mr-sm" color="secondary" label="默认值" />
          {{ defaultDesc }}
        </div>
      </q-tooltip>
    </td>
  </tr>
</template>

<script>
// 【其他接口列表项】
const CATEGORY_NAME = {
  props: '属性',
  methods: '方法',
  events: '事件',
  slots: '插槽',
  scopedSlots: '作用域插槽',
  value: '指令值',
  arg: '指令参数',
  modifiers: '修饰符',
  injection: '注入项',
  quasarConfOptions: '配置选项'
}

export default {
  name: 'OtherApiItem',

  data: () => ({
    pinTooltip: false
  }),

  props: {
    name: {
      type: String,
      required: true
    },
    api: {
      required: true
    },
    category: {
      type: String,
      required: true
    },
    type: String,
    defaultDesc: String,
    description: String
  },

  computed: {
    // 类别名称
    categoryName() {
      return CATEGORY_NAME[this.category]
    },

    // 接口名称
    apiName() {
      switch (this.category) {
        case 'methods':
          return this.name + '()'
        case 'events':
          return '@' + this.name
        case 'slots':
        case 'scopedSlots':
          return '#' + this.name
        case 'value':
          return this.api.directive + '="?"'
        case 'arg':
          return this.api.directive + ':?'
      }
      return this.name
    },

    // 类别颜色
    categoryColor() {
      switch (this.category) {
        case 'props':
        case 'events':
        case 'value':
        case 'arg':
          return ['text-primary', this.$q.dark.isActive ? 'bg-blue-grey-10' : 'bg-blue-1']
        case 'methods':
        case 'modifiers':
          return ['text-accent', this.$q.dark.isActive ? 'bg-brown-10' : 'bg-purple-1']
        default:
          return ['text-green', this.$q.dark.isActive ? 'bg-teal-10' : 'bg-green-1']
      }
    },

    // 接口颜色
    apiColor() {
      switch (this.category) {
        case 'props':
        case 'events':
        case 'value':
        case 'arg':
          return 'text-primary'
        case 'methods':
        case 'modifiers':
          return 'text-accent'
        default:
          return 'text-green'
      }
    }
  },

  methods: {
    // 点击接口名
    clickApiName() {
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
