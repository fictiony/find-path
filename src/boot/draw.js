// 【绘图工具函数】
import Vue from 'vue'

let edit

// 格子颜色
const OBSTACLE_COLOR = [150, 100, 0, 30] // 不同程度的障碍（Alpha分量32~230表示状态值1~100）
const WALL_COLOR = [150, 30, 60, 230] // 绝对阻挡不可通过
const OPEN_COLOR = [100, 250, 100, 200] // 开启节点（Green分量240~50表示状态值1~20+）
const CLOSE_COLOR = [50, 210, 210, 200] // 关闭节点（Green/Blue分量200~10表示状态值101~120+）
const PATH_COLOR = [30, 120, 190, 250] // 路径节点

// 算法类型
export const ALGORITHMS = Object.freeze([
  {
    value: 'astar',
    label: 'A*寻路',
    tips: `目前最流行的启发式广度搜索寻路算法
<br>从起点开始依次检测周围节点并加入开启列表，然后每次从开启列表中取出优先级（按启发函数进行评估）最高的点继续展开，直到展开到终点为止
<br>优先级的计算公式为：f = g + h
<br>其中，f表示优先级，g表示已经过的路径长度，h表示启发值`
  },
  {
    value: 'bestfirst',
    label: '最近优先寻路',
    tips: `A*寻路算法的变种，区别只是提升了启发函数值在优先级计算中的权重
（即：f = g + h * w），但可能会导致最终得到的不是最优解`
  },
  {
    value: 'dijkstra',
    label: '最短路径寻路',
    tips: '又称Dijkstra算法，可以看做是A*算法忽略启发值（即h=0）后的简化版本'
  },
  {
    value: 'js_astar',
    label: '第三方A*寻路',
    tips: `目前Github上star数最高的JS版A*算法代码
<br>参考地址：https://github.com/bgrins/javascript-astar
<br>启发函数不支持欧几里德距离和切比雪夫距离（改用曼哈顿距离）
<br>对角移动不支持无阻挡可走和非全阻挡可走（改用始终可走）
<br>注：代码经过少量调整，以便支持异步演示功能`
  }
])

// 启发函数类型
export const HEURISTICS = Object.freeze([
  {
    value: 'manhattan',
    label: '曼哈顿距离',
    tips: '启发值为当前点离终点的横纵向距离和，适用于只能上下左右移动的情况'
  },
  {
    value: 'euclidean',
    label: '欧几里德距离',
    tips: '启发值为当前点离终点的直线距离'
  },
  {
    value: 'octile',
    label: '八分角距离',
    tips:
      '启发值为当前点离终点的斜45°折线距离，适用于能对角线（即八方向）移动的情况'
  },
  {
    value: 'chebyshev',
    label: '切比雪夫距离',
    tips: '启发值为当前点离终点的横纵向距离中的较大值'
  }
])

// 对角线可走类型
export const DIAGONAL_MOVES = Object.freeze([
  { value: 0, label: '不可走' },
  { value: 1, label: '无阻挡可走' },
  { value: 2, label: '非全阻挡可走' },
  { value: 3, label: '始终可走' }
])

// 起止点模式
export const POINT_MODES = Object.freeze([
  { value: 1, name: '起点', icon: 'logout', shortcut: 'Q' },
  { value: 2, name: '终点', icon: 'login', shortcut: 'Z' }
])

// 笔刷模式
export const BRUSH_MODES = Object.freeze([
  { value: 1, name: '叠加', icon: 'radio_button_checked', shortcut: 'A' },
  { value: 2, name: '扣除', icon: 'radio_button_unchecked', shortcut: 'D' },
  { value: 3, name: '合并', icon: 'edit', shortcut: 'C' },
  { value: 4, name: '清除', icon: 'cleaning_services', shortcut: 'E' }
])

// 笔刷样式
export const BRUSH_TYPES = Object.freeze([
  { value: 1, name: '方形', icon: 'border_all' },
  { value: 2, name: '圆形', icon: 'circle' },
  { value: 3, name: '随机杂点', icon: 'blur_on' },
  { value: 4, name: '随机散布(方形)', icon: 'apps' },
  { value: 5, name: '随机散布(圆形)', icon: 'grain' }
])

// 格子状态值转格子颜色
// - @state 格子状态值
// - @return 格子颜色
export function gridToColor (state) {
  if (state > 100) return WALL_COLOR
  if (state > 0) {
    const [r, g, b, a] = OBSTACLE_COLOR
    return [r, g, b, a + state * 2]
  }
  return [0, 0, 0, 0]
}

// 寻路状态值转格子颜色
// - @state 寻路状态值
// - @return 格子颜色
export function pathToColor (state) {
  if (state > 200) return PATH_COLOR
  edit = edit || Vue.store.state.edit
  if (edit.showState) {
    if (state > 100) {
      const [r, g, b, a] = CLOSE_COLOR
      const k = Math.min(20, state - 100) * 10
      return [r, g - k, b - k, a]
    }
    if (state > 0) {
      const [r, g, b, a] = OPEN_COLOR
      const k = Math.min(20, state) * 10
      return [r, g - k, b, a]
    }
  }
  return [0, 0, 0, 0]
}

// 设置单个像素颜色
// - @data 位图数据
// - @index 像素序号
// - @r, g, b, a 颜色分量
export function setPixel (data, index, r, g, b, a = 255) {
  data[index] = r
  data[index + 1] = g
  data[index + 2] = b
  data[index + 3] = a
}

// 计算两个区域的重合部分
// - @a1, b1 区域1的起止位置
// - @a2, b2 区域2的起止位置
// - @return [起始位置, 终止位置]
function intersect (a1, b1, a2, b2) {
  if (a1 < a2) {
    if (b1 < a2) return [0, 0]
    if (b1 > b2) return [a2, b2]
    return [a2, b1]
  } else {
    if (a1 > b2) return [0, 0]
    if (b1 < b2) return [a1, b1]
    return [a1, b2]
  }
}

// 计算两个矩形的交叉区域
// - @x1, y1, w1, h1 矩形1的坐标和宽高
// - @x2, y2, w2, h2 矩形2的坐标和宽高
// - @return [x, y, w, h] 交叉区域的坐标和宽高
export function intersectRect (x1, y1, w1, h1, x2, y2, w2, h2) {
  const [xa, xb] = intersect(x1, x1 + w1, x2, x2 + w2)
  const [ya, yb] = intersect(y1, y1 + h1, y2, y2 + h2)
  return [xa, ya, xb - xa, yb - ya]
}

// 合并两个矩形区域
// - @return [x, y, w, h] 合并区域的坐标和宽高
export function mergeRect (x1, y1, w1, h1, x2, y2, w2, h2) {
  const x = Math.min(x1, x2)
  const y = Math.min(y1, y2)
  const w = Math.max(x1 + w1, x2 + w2) - x
  const h = Math.max(y1 + h1, y2 + h2) - y
  return [x, y, w, h]
}

// 计算两个矩形区域的合并区域，并按横向切成最大的子矩形
// - @return [[x, y, w, h], ...] 合并区域子矩形的坐标和宽高
export function mergeRectSlice (x1, y1, w1, h1, x2, y2, w2, h2) {
  const [, y, w, h] = intersectRect(x1, y1, w1, h1, x2, y2, w2, h2)
  if (!w || !h) {
    // 无重合
    return [
      [x1, y1, w1, h1],
      [x2, y2, w2, h2]
    ]
  } else if (w === w1 && h === h1) {
    // 矩形2包含矩形1
    return [[x2, y2, w2, h2]]
  } else if (w === w2 && h === h2) {
    // 矩形1包含矩形2
    return [[x1, y1, w1, h1]]
  } else if (w === w1 && w === w2) {
    // 矩形1和矩形2宽度重合
    return [[x1, Math.min(y1, y2), w, h1 + h2 - h]]
  } else {
    const rects = []
    // 取上层
    let dy = y1 - y2
    if (dy < 0) {
      rects.push([x1, y1, w1, -dy])
    } else if (dy > 0) {
      rects.push([x2, y2, w2, dy])
    }
    // 取中层（肯定包含交叉区域）
    rects.push([Math.min(x1, x2), y, w1 + w2 - w, h])
    // 取下层
    dy += h1 - h2
    if (dy < 0) {
      rects.push([x2, y + h, w2, -dy])
    } else if (dy > 0) {
      rects.push([x1, y + h, w1, dy])
    }
    return rects
  }
}
