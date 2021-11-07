export default {
  data() {
    return {
      editValue: this.value
    }
  },

  props: {
    immediate: Boolean
  },

  watch: {
    value(val) {
      this.editValue = val
    },
    editValue(val) {
      if (this.immediate) {
        this.onInput(val)
      }
    }
  },

  methods: {
    onEditFinish() {
      if (!this.immediate && this.editValue !== this.value) {
        this.onInput(this.editValue)
      }
    },
    onEditCancel() {
      if (!this.immediate) {
        this.editValue = this.value
      }
    }
  }
}
