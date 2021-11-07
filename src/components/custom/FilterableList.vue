<template>
  <div class="column no-wrap">
    <q-virtual-scroll ref="scroller" class="q-space" flat bordered type="table" separator="cell" :items="filteredItems">
      <template v-slot:before>
        <thead class="sticky-thead narrow">
          <tr :class="$q.dark.isActive ? 'bg-blue-grey-7' : 'bg-grey-3 text-primary'">
            <th style="width: 1px" @click="onClickHead()">#</th>
            <th
              v-for="col in columns"
              :key="col.name || col.label"
              class="sticky"
              :class="col.headClass || col.class"
              :style="col.headStyle || col.style"
              @click="onClickHead(col)"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
      </template>
      <template v-slot="{ item, index }">
        <tr :key="index" class="narrow" :style="getItemStyle(item)">
          <td
            class="text-right text-primary"
            :class="$q.dark.isActive ? 'bg-blue-grey-10' : 'bg-blue-1'"
            style="width: 1px"
            @click="onClickItem(item, null, index)"
            @dblclick="onDblClickItem(item, null, index)"
          >
            {{ index + 1 }}
          </td>
          <td
            v-for="col in columns"
            :key="`${index}-${col.name || col.label}`"
            class="text-select"
            :class="col.class"
            :style="col.style"
            @click="onClickItem(item, col, index)"
            @dblclick="onDblClickItem(item, col, index)"
          >
            <template v-if="!col.type || col.type === 'text'">
              {{ getItemField(item, index, col.field) }}
            </template>
            <div v-html="getItemField(item, index, col.field)" v-if="col.type === 'html'" />
            <component :is="col.type" v-bind="{ ...getItemField(item, index, col.field) }" v-else />
          </td>
        </tr>
      </template>
    </q-virtual-scroll>

    <q-input dense outlined clearable class="q-mt-xs narrow" v-model="filterWord" placeholder="请输入筛选词" :debounce="100" v-if="filterFn">
      <template #prepend>
        <q-icon name="search">
          <q-menu no-focus auto-close anchor="top left" self="bottom left" :offset="[10, 5]" v-model="filterMenu" v-if="filterPresets.length">
            <q-list dense>
              <q-item v-for="(item, index) in filterPresets" :key="index" clickable @click="filterWord = item.text || item">
                <q-item-section>{{ item.label || item.text || item }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-icon>
      </template>
    </q-input>
  </div>
</template>

<script>
import { debounce } from 'quasar'

// 【可筛选数据列表】
export default {
  data: () => ({
    filterWord: '', // 筛选词
    filterMenu: false // 筛选菜单
  }),

  props: {
    items: {
      // 数据项列表
      type: Array,
      required: true
    },
    columns: {
      // 数据列定义列表，每项为：{ name: 列名（可选，用于唯一标识）, label: 列标题, field: 字段名或字段取值函数（格式为：(数据项, 序号) => 字段值）,
      // type: 内容类型（可为text/html/组件，空表示text）, class: 单元格样式类, style: 单元格样式,
      // headClass: 标头单元格样式类（默认取class）, headStyle: 标头单元格样式（默认取style） }
      type: Array,
      required: true
    },
    filterFn: Function, // 筛选函数（若未提供则无筛选功能），格式为：(筛选, 数据项, 序号) => 是否满足
    filterPresets: {
      // 预设筛选词列表，每项为：筛选词或 { label: 显示名称（可选）, text: 筛选词 }
      type: Array,
      default: () => []
    },
    sort: [String, Array, Function], // 排序字段、[排序字段, 是否倒序] 或函数（空表示不排序）
    itemStyleFn: {
      // 数据项样式函数，格式为：数据项 => 表格行样式（可为String/Array/Object），未指定或返回null则使用默认样式
      type: Function
    },
    selectedItem: {}, // 当前选中数据项（可为列表），或用于判断数据项是否选中的函数，格式为：数据项 => 是否选中
    compareJson: Boolean // 是否采用JSON格式对比选中数据项（用于避免数据被clone之后无法比对）
  },

  computed: {
    // 过滤后的数据项列表
    filteredItems() {
      let items = this.items
      if (this.filterWord && this.filterFn) {
        items = items.filter((item, index) => this.filterFn(this.filterWord, item, index))
      } else {
        items = items.slice()
      }
      if (this.sort) {
        if (this.sort instanceof Function) {
          items.sort(this.sort)
        } else if (this.sort instanceof Array) {
          items.sortBy(...this.sort)
        } else {
          items.sortBy(this.sort)
        }
      }
      return Object.freeze(items)
    },

    // 选中数据项的JSON
    selectedJson() {
      return JSON.stringify(this.selectedItem)
    }
  },

  methods: {
    // 获取数据项字段值
    getItemField(item, index, field) {
      return field instanceof Function ? field(item, index) : item[field]
    },

    // 获取数据项样式
    getItemStyle(item) {
      if (this.itemStyleFn) {
        const style = this.itemStyleFn(item)
        if (style != null) return style
      }
      return this.isSelected(item) ? 'background-color: #8f43 !important' : ''
    },

    // 判断数据项是否选中
    isSelected(item) {
      if (this.selectedItem instanceof Function) {
        return this.selectedItem(item)
      }
      if (this.selectedItem instanceof Array) {
        return this.selectedItem.find(i => i.info === item) != null
      }
      if (item === this.selectedItem) return true
      if (this.compareJson && JSON.stringify(item) === this.selectedJson) return true
      return false
    },

    // 滚动到选中项
    scrollToSelected: debounce(function () {
      if (!this.selectedItem) return
      const index = this.filteredItems.findIndex(i => this.isSelected(i))
      if (index < 0) return
      this.$refs.scroller.scrollTo(index, 'center')
    }, 10),

    // 单击数据列标头
    // - @col 点击的数据列定义
    onClickHead(col) {
      this.$emit('click-head', col)
    },

    // 单击选中数据项
    // - @item 数据项
    // - @col 点击的数据列定义（序号列为null）
    // - @index 数据项序号
    onClickItem(item, col, index) {
      this.$emit('select', item, col, index)
    },

    // 双击使用数据项
    // - @item 数据项
    // - @col 点击的数据列定义（序号列为null）
    // - @index 数据项序号
    onDblClickItem(item, col, index) {
      this.$emit('use', item, col, index)
    }
  },

  // 初始自动滚动到选中项处
  mounted() {
    this.scrollToSelected()
  },

  // 从keepalive激活时虚拟滚动列表不会刷新，需手动刷新
  activated() {
    this.$refs.scroller.refresh()
    this.scrollToSelected()
  }
}
</script>
