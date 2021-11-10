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
