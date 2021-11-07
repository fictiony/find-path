export default {
  props: {
    value: {
      required: true
    },
    inline: Boolean,
    autoSave: Boolean
  },

  methods: {
    onInput (val) {
      this.$emit('input', val)
    }
  }
}
