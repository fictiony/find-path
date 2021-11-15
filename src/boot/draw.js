// 【绘图工具函数】

// 格子颜色
const OBSTACLE_COLOR = [150, 100, 0] // 不同程度的障碍（Alpha分量31~230表示程度）
const WALL_COLOR = [150, 30, 60, 230] // 绝对阻挡不可通过

// 笔刷模式
export const BRUSH_MODES = [
  { value: 1, name: '叠加', icon: 'radio_button_checked', shortcut: 'A' },
  { value: 2, name: '扣除', icon: 'radio_button_unchecked', shortcut: 'D' },
  { value: 3, name: '合并', icon: 'edit', shortcut: 'C' },
  { value: 4, name: '清除', icon: 'cleaning_services', shortcut: 'E' }
]

// 笔刷样式
export const BRUSH_TYPES = [
  { value: 1, name: '方形', icon: 'border_all' },
  { value: 2, name: '圆形', icon: 'circle' },
  { value: 3, name: '随机杂点', icon: 'blur_on' },
  { value: 4, name: '随机散布(方形)', icon: 'apps' },
  { value: 5, name: '随机散布(圆形)', icon: 'grain' }
]

// 格子状态值转格子颜色
// - @state 格子状态值
// - @return 格子颜色
export function stateToColor (state) {
  if (state > 100) return WALL_COLOR
  if (state > 0) return [...OBSTACLE_COLOR, 30 + state * 2]
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
