// 【编辑相关】
import { LocalStorage } from 'quasar'
import { genMutations, notify, showMsg, setClipboardText } from 'boot/utils'

// ----------------------------------------------------------------------------【state】
const state = () => ({
  xGrids: 100, // 横向格数
  yGrids: 100, // 纵向格数
  gridSize: 20, // 格子边长
  gridStates: {}, // 格子状态表：{ 序号: 状态值 }，序号为：X坐标 + Y坐标 * 纵向格数， 状态值可为：1~100-不同程度的阻碍/101~200-绝对阻挡不可通过/其他-无阻挡
  dirtyArea: null, // 脏区域范围：[left, top, width, height]

  brushMode: null, // 笔刷模式：1-叠加/2-扣除/3-合并/4-清除/null-无
  brushType: 2, // 笔刷样式：1-正方形/2-圆形/3-随机杂点
  brushSize: 5, // 笔刷大小（1~200）
  brushSoft: 0, // 笔刷软度（0~100），值越大表示边缘越快渐变到1，0表示不渐变
  // 计算公式为：(cos(π * D^(1-ln(S/50))^2) + 1) / 2，其中D/S分别表示距离/软度
  brushState: 200, // 笔刷状态值（1~200）
  brushStatesRefresh: 1, // 用于手动刷新笔刷格子状态列表（当笔刷类型为随机杂点时有用）
  brushPos: null // 笔刷当前位置：{x, y}
})

// ----------------------------------------------------------------------------【getters】
const getters = {
  // 网格宽度的一半
  halfGridWidth (state) {
    return (state.xGrids * state.gridSize) / 2
  },

  // 网格高度的一半
  halfGridHeight (state) {
    return (state.yGrids * state.gridSize) / 2
  },

  // 位置坐标转格点坐标
  // - @x, y 位置坐标
  // - @return [X格点, Y格点]
  getGridXY (state) {
    return (x, y) => {
      const { xGrids, yGrids, gridSize } = state
      return [
        Math.floor(x / gridSize + xGrids / 2),
        Math.floor(y / gridSize + yGrids / 2)
      ]
    }
  },

  // 笔刷格子状态列表（预先计算好）
  brushStates (state) {
    if (!state.brushStatesRefresh) return
    const { brushType, brushSize, brushSoft, brushState } = state
    const states = new Array(brushSize * brushSize)
    if (brushType === 1 && brushSoft === 0) {
      states.fill(brushState)
    } else {
      const c = (brushSize - 1) / 2
      for (let y = 0, i = 0; y < brushSize; y++) {
        for (let x = 0; x < brushSize; x++) {
          let d // 距离与半径的比值
          let s = brushState // 当前格子的状态值
          if (brushType > 1) {
            d = Math.hypot(x - c, y - c) / (c + 0.5)
            if (d > 1) {
              s = 0
            } else if (brushType === 3) {
              const p = (1 - d) ** 2 // 中心最大概率1，向边缘递减到0
              if (Math.random() >= p) {
                s = 0
              }
            }
          } else if (brushSoft > 0) {
            d = Math.max(Math.abs(x - c), Math.abs(y - c)) / (c + 0.5)
          }
          if (s > 0 && brushSoft > 0) {
            const ratio = (1 - Math.log(brushSoft / 50)) ** 2
            s = Math.max(
              1,
              Math.round((Math.cos(Math.PI * d ** ratio) + 1) * (s / 2))
            )
          }
          states[i++] = s
        }
      }
    }
    return states
  }
}

// ----------------------------------------------------------------------------【mutations】
const mutations = {
  ...genMutations([
    'xGrids',
    'yGrids',
    'gridSize',
    'gridStates',
    'dirtyArea',
    'brushMode',
    'brushType',
    'brushSize',
    'brushSoft',
    'brushState',
    'brushStatesRefresh',
    'brushPos'
  ])
}

// ----------------------------------------------------------------------------【actions】
const actions = {
  // 将当前格子状态表转为图片数据URL
  // - @return 图片数据URL
  async gridStatesToDataURL ({ state }) {
    const { xGrids, yGrids, gridStates } = state

    // 先转为图片数据（每3行格子状态分别记到各像素的RGB分量中，可最大程度形成连续同色点，提高PNG压缩率）
    const imageData = new ImageData(xGrids, Math.ceil(yGrids / 3))
    const data = imageData.data
    for (let i = data.length - 1; i > 0; i -= 4) {
      data[i] = 255 // Alpha统一用255（不用Alpha通道存格子状态，否则会造成RGB分量丢失）
    }
    for (const index in gridStates) {
      if (!gridStates[index]) continue
      const y = Math.floor(index / xGrids)
      const i = ((index % xGrids) + Math.floor(y / 3) * xGrids) * 4 + (y % 3)
      data[i] = gridStates[index]
    }

    // 再画到临时画布上
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')
    ctx.putImageData(imageData, 0, 0)

    return canvas.toDataURL()
  },

  // 将图片数据URL转为格子状态表
  // - @dataURL 图片数据URL
  // - @return 格子状态表
  async dataURLToGridStates ({ state }, dataURL) {
    return new Promise(resolve => {
      const image = new Image()
      image.onload = () => {
        const w = image.naturalWidth
        const h = image.naturalHeight

        // 加载成功后，将图片画到临时画布上
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0)

        // 再从每个像素中取出RGB分量，分别对应3行格子的状态
        const { data } = ctx.getImageData(0, 0, w, h)
        const states = {}
        for (let i = data.length - 1; i >= 0; i--) {
          if (!data[i] || i % 4 === 3) continue
          const index = Math.floor(i / 4)
          const y = Math.floor(index / w) * 3 + (i % 4)
          states[(index % w) + y * w] = data[i]
        }

        resolve(states)
      }
      image.src = dataURL
    })
  },

  // 加载格子状态
  async loadGrids ({ commit, dispatch }) {
    const info = LocalStorage.getItem('FindPathGrids-1')
    if (info) {
      const [w, h] = info.size
      const states = await dispatch('dataURLToGridStates', info.states)
      commit('xGrids', w)
      commit('yGrids', h)
      commit('gridStates', states)
      commit('dirtyArea', null)
      notify('加载完成')
    } else {
      showMsg('加载失败！')
    }
  },

  // 保存格子状态
  async saveGrids ({ state, dispatch }) {
    LocalStorage.set('FindPathGrids-1', {
      size: [state.xGrids, state.yGrids],
      states: await dispatch('gridStatesToDataURL')
    })
    notify('保存成功')
  },

  // 复制格子状态
  async copyGrids ({ dispatch }) {
    setClipboardText(await dispatch('gridStatesToDataURL'))
    notify('已复制到剪贴板')
  },

  // 清空格子状态
  async clearGrids ({ commit }) {
    commit('gridStates', {})
    commit('dirtyArea', null)
  },

  // 笔刷涂点
  // - @pos 指定坐标（未指定则取当前笔刷位置）
  async brushDraw ({ state, getters, commit }, pos) {
    const { xGrids, yGrids, gridStates, brushMode, brushSize } = state
    if (!brushMode) return
    const { x, y } = pos || state.brushPos
    const offset = Math.floor(brushSize / 2)

    // 绘制
    getters.brushStates.forEach((state, index) => {
      if (!state) return
      const bx = x - offset + (index % brushSize)
      if (bx < 0 || bx >= xGrids) return
      const by = y - offset + Math.floor(index / brushSize)
      if (by < 0 || by >= yGrids) return
      index = bx + by * xGrids
      const oldState = gridStates[index] || 0
      switch (brushMode) {
        case 1: // 叠加
          gridStates[index] = Math.min(200, oldState + state)
          break
        case 2: // 扣除
          gridStates[index] = Math.max(0, oldState - state)
          break
        case 3: // 合并
          gridStates[index] = Math.max(oldState, state)
          break
        case 4: // 清除
          gridStates[index] = 0
          break
      }
    })

    // 更新脏区域
    const area = [x - offset, y - offset, brushSize, brushSize]
    if (state.dirtyArea) {
      const [x1, y1, w1, h1] = state.dirtyArea
      const [x2, y2, w2, h2] = area
      area[0] = Math.min(x1, x2)
      area[1] = Math.min(y1, y2)
      area[2] = Math.max(x1 + w1, x2 + w2) - area[0]
      area[3] = Math.max(y1 + h1, y2 + h2) - area[1]
    }
    commit('dirtyArea', area)

    // 若笔刷样式为随机，则每画一笔刷新一次
    if (state.brushType === 3) {
      commit('brushStatesRefresh', state.brushStatesRefresh + 1)
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
