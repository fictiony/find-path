<template>
  <q-tooltip v-bind="params" v-on="$listeners">
    <template v-if="type === 'multiline'">
      <template v-for="(line, index) in tips">
        <br :key="-index" v-if="index > 0" />
        <span :key="index" v-html="getContent(line)" v-if="getType(line) === 'html'" />
        <q-markdown :key="index" :src="getContent(line)" v-else-if="getType(line) === 'markdown'" />
        <template v-else>{{ line }}</template>
      </template>
    </template>
    <span v-html="getContent(tips)" v-else-if="type === 'html'" />
    <q-markdown :src="getContent(tips)" v-else-if="type === 'markdown'" />
    <template v-else>{{ tips }}</template>
  </q-tooltip>
</template>

<script>
// 【通用工具提示】
export default {
  props: {
    tips: {
      // 提示信息（为字符串时若以html\s或md\s开头，则表示html格式或markdown格式，为数组时每项为一行，并自动用<br/>分隔，每行开头一样可带html\s或md\s）
      type: [String, Array],
      required: true
    }
  },

  computed: {
    // 组件参数表
    params() {
      return { maxWidth: '400px', anchor: 'top left', self: 'top right', ...this.$attrs }
    },

    // 提示类型：str/multiline/html/markdown
    type() {
      if (this.tips instanceof Array) return 'multiline'
      return this.getType(this.tips)
    }
  },

  methods: {
    // 获取提示类型
    getType(str) {
      if (str.match(/^html\s/)) return 'html'
      if (str.match(/^md\s/)) return 'markdown'
      return 'str'
    },

    // 获取提示文字内容
    getContent(str) {
      switch (this.getType(str)) {
        case 'html':
          return str.replace(/^html\s+/, '')
        case 'markdown':
          return str.replace(/^md\s+/, '')
      }
      return str
    }
  }
}
</script>
