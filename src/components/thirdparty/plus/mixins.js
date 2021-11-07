// 【自定义混入】

// 替换属性（用于解决属性无法在组件内直接赋值的问题）
// - @prop 要替换的属性名
// - @dataProp 用来替换的data类属性名（默认为prop前加'_'）
// - @updateEvent dataProp更改时要触发的事件名（默认为'update:'加prop，用于提供sync修饰符的支持，可设为'input'以便支持v-model）
// - @return 一个mixin
export function swapProp(prop, dataProp, updateEvent) {
  dataProp = dataProp || '_' + prop
  updateEvent = updateEvent || 'update:' + prop
  return {
    data: vm => ({
      [dataProp]: vm[prop]
    }),
    watch: {
      [prop]: function(val) {
        this[dataProp] = val
      },
      [dataProp]: function(val) {
        this.$emit(updateEvent, val)
      }
    }
  }
}
