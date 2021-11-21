import PathNode from './PathNode'
import AStarPathFinder from './AStarPathFinder'
import { astar as astar2, Graph } from './javascript-astar' // most popular implementation of astar for compare

export default async function benchmark (
  times = 100, // run times
  size = 1000, // edge length of the square map
  ratio = 0.2, // ratio of the block grids
  diagonal = true, // whether diagonal moves are allowed
  showStats = false // Count the times of node open/update/close and show the stats
) {
  const rand = () => Math.floor(Math.random() * size)
  const now = () => (performance ? performance.now() : Date.now())

  // prepare map and path finder
  const nodes = new Map()
  const grids = []
  for (let x = 0; x < size; x++) {
    const row = (grids[x] = [])
    for (let y = 0; y < size; y++) {
      row[y] = 0
      if (Math.random() < ratio) continue
      row[y] = 1
      nodes.set(PathNode.xyToId(x, y), new PathNode(x, y))
    }
  }
  const graph = new Graph(grids, { diagonal })
  const astar = new AStarPathFinder(id => nodes.get(id), {
    diagonalMove: diagonal ? 3 : 0,
    heuristic: diagonal ? 'octile' : 'manhattan'
  })
  const options2 = {
    heuristic: astar2.heuristics[diagonal ? 'diagonal' : 'manhattan']
  }
  const stats = {
    open: 0,
    update: 0,
    close: 0,
    open2: 0,
    update2: 0,
    close2: 0
  }
  if (showStats) {
    astar.openNotify = () => !++stats.open
    astar.updateNotify = () => !++stats.update
    astar.closeNotify = () => !++stats.close
    options2.openNotify = () => !++stats.open2
    options2.updateNotify = () => !++stats.update2
    options2.closeNotify = () => !++stats.close2
  }

  // run tests
  const results = []
  let start, end, start2, end2
  for (let i = 0; i < times; i++) {
    do start = astar.getNodeAt(rand(), rand())
    while (!start)
    do end = astar.getNodeAt(rand(), rand())
    while (!end)
    start2 = graph.grid[start.x][start.y]
    end2 = graph.grid[end.x][end.y]
    Object.keys(stats).forEach(i => (stats[i] = 0))

    const beginTime = now()
    const path = await astar.findPath(start, end)
    const endTime = now()
    const path2 = await astar2.search(graph, start2, end2, options2)
    const endTime2 = now()

    results.push({
      path,
      time: endTime - beginTime,
      path2,
      time2: endTime2 - endTime,
      ...stats
    })
  }

  // output results
  let totalTime = 0
  let totalTime2 = 0
  for (let i = 0; i < times; i++) {
    const { path, open, update, close, time } = results[i]
    const { path2, open2, update2, close2, time2 } = results[i]
    totalTime += time
    totalTime2 += time2
    if (i < 100) {
      console.log(
        `#${i}:`,
        path ? `Found path with ${path.length - 1} steps` : 'Found no path',
        showStats ? `(${open} + ${update} + ${close})` : '',
        `in ${time.toFixed(2)} ms. ${time > time2 ? '' : '---------- better'}`
      )
      console.log(
        path2
          ? `Others found path with ${path2.length} steps`
          : 'Found no path',
        showStats ? `(${open2} + ${update2} + ${close2})` : '',
        `in ${time2.toFixed(2)} ms.`
      )
    }
  }
  console.log(
    `Run ${times} times,`,
    `took ${(totalTime / times).toFixed(2)} ms in average.`,
    `Others took ${(totalTime2 / times).toFixed(2)} ms in average.`
  )

  return results
}
