// 【按优先级排序的节点列表】

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
    this.clear()
  }

  // 是否为空
  get isEmpty () {
    return this.nodes.length === 0
  }

  // 添加节点
  push (node) {
    this.pushCount++
    this.nodes.push(node)
    if (this.heapSort) {
      this.__sinkDown(this.nodes.length - 1)
    } else {
      this.needSort = true
    }
  }

  // 取出优先级最高的节点
  pop () {
    this.popCount++
    if (this.isEmpty) return
    const { nodes } = this
    if (this.heapSort) {
      const node = nodes[0]
      const end = nodes.pop()
      if (nodes.length > 0) {
        nodes[0] = end
        this.__bubbleUp(0)
      }
      return node
    } else {
      if (this.needSort) {
        this.needSort = false
        nodes.sort(this.compare)
      }
      return nodes.pop()
    }
  }

  // 更新节点顺序
  update (node) {
    this.updateCount++
    if (this.heapSort) {
      this.__sinkDown(this.nodes.indexOf(node))
    } else {
      this.needSort = true
    }
  }

  // 清空节点列表
  clear () {
    this.nodes.length = 0
    this.pushCount = 0
    this.popCount = 0
    this.updateCount = 0
  }

  // 沉入节点到合适的位置
  // - @index 节点序号
  __sinkDown (index) {
    const { nodes, compare } = this
    const node = nodes[index]
    while (index > 0) {
      const parentIndex = ((index + 1) >> 1) - 1
      const parent = nodes[parentIndex]

      // 若节点比父节点优先级更高，则继续下沉，否则结束
      if (compare(node, parent) >= 0) break
      nodes[parentIndex] = node
      nodes[index] = parent
      index = parentIndex
    }
  }

  // 浮出节点到合适的位置
  // - @index 节点序号
  __bubbleUp (index) {
    const { nodes, compare } = this
    const len = nodes.length
    const node = nodes[index]
    while (true) {
      let swap = -1 // 要交换的位置

      // 若子节点优先级更高，则将和子节点交换位置（取优先级较高的子节点）
      const childIndex1 = ((index + 1) << 1) - 1
      if (childIndex1 < len) {
        const child1 = nodes[childIndex1]
        if (compare(child1, node) < 0) {
          swap = childIndex1
        }
        const childIndex2 = childIndex1 + 1
        if (childIndex2 < len) {
          const child2 = nodes[childIndex2]
          if (compare(child2, swap < 0 ? node : child1) < 0) {
            swap = childIndex2
          }
        }
      }

      // 若找到，则进行交换，否则结束
      if (swap < 0) break
      nodes[index] = nodes[swap]
      nodes[swap] = node
      index = swap
    }
  }
}
