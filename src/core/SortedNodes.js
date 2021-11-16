// 【按优先级排序的节点列表】
import Heap from 'heap'

export default class SortedNodes {
  compare = null // 优先级比较函数：(a, b) => result（<0表示a优先级较高，>0表示b优先级较高,=0表示优先级相同）
  heapSort = false // 是否采用二叉堆排序，否则用数组快速排序
  nodes = [] // 节点列表
  needSort = false // 是否需要排序

  // 构造函数
  constructor (compare, heapSort = false) {
    compare = compare || ((a, b) => a - b)
    this.compare = compare
    this.heapSort = heapSort
    if (!heapSort) {
      this.compare = (a, b) => -compare(a, b) // 数组排序时优先级高的放最后，方便取出
    }
  }

  // 是否为空
  get isEmpty () {
    return this.nodes.length === 0
  }

  // 添加节点
  push (node) {
    if (this.heapSort) {
      Heap.push(this.nodes, node, this.compare)
    } else {
      this.nodes.push(node)
      this.needSort = true
    }
  }

  // 取出优先级最高的节点
  pop () {
    if (this.isEmpty) return
    if (this.heapSort) {
      Heap.pop(this.nodes, this.compare)
    } else {
      this.sort()
      return this.nodes.pop()
    }
  }

  // 更新节点顺序
  update (node) {
    if (this.heapSort) {
      Heap.updateItem(this.nodes, node, this.compare)
    } else {
      this.needSort = true
    }
  }

  // 排序所有节点
  sort () {
    if (this.heapSort) {
      Heap.heapify(this.nodes, this.compare)
    } else if (this.needSort) {
      this.needSort = false
      this.nodes.sort(this.compare)
    }
  }

  // 清空节点列表
  clear () {
    this.nodes.length = 0
  }
}
