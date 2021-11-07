import { QScrollArea } from 'quasar'

// 【定制滚动器】
export default {
  extends: QScrollArea,
  props: {
    barStyle: {
      type: Object,
      default: () => ({
        right: '1px',
        borderRadius: '6px',
        backgroundColor: '#027be3',
        width: '6px',
        opacity: 0.2
      })
    },
    thumbStyle: {
      type: Object,
      default: () => ({
        right: '1px',
        borderRadius: '6px',
        backgroundColor: '#027be3',
        width: '6px',
        opacity: 0.7
      })
    }
  }
}
