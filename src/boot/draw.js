// 【绘图工具函数】

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

// 计算两个矩形的合并区域
// - @x1, y1, w1, h1 矩形1的坐标和宽高
// - @x2, y2, w2, h2 矩形2的坐标和宽高
// - @return [[x, y, w, h], ...] 合并区域的坐标和宽高（按纵向切成多个矩形）
export function mergeRect (x1, y1, w1, h1, x2, y2, w2, h2) {
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
