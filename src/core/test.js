import PathNode from './PathNode'
import AStarPathFinder from './AStarPathFinder'
import TestPathFinder from './TestPathFinder'

export default async function test (
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
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (Math.random() < ratio) continue
      nodes.set(PathNode.xyToId(x, y), new PathNode(x, y))
    }
  }
  const options = {
    diagonalMove: diagonal ? 3 : 0,
    heuristic: diagonal ? 'octile' : 'manhattan'
  }
  const astar = new AStarPathFinder(id => nodes.get(id), options)
  const tester = new TestPathFinder(id => nodes.get(id), options)
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
    tester.openNotify = () => !++stats.open2
    tester.updateNotify = () => !++stats.update2
    tester.closeNotify = () => !++stats.close2
  }

  // run tests
  const results = []
  let start, end, path, path2
  for (let i = 0; i < times; i++) {
    do start = astar.getNodeAt(rand(), rand())
    while (!start)
    do end = astar.getNodeAt(rand(), rand())
    while (!end)
    Object.keys(stats).forEach(i => (stats[i] = 0))

    // to avoid performance difference caused by the execution order, execute them alternately
    const beginTime = now()
    if (i % 2) {
      path2 = await tester.findPath(start, end)
      astar.findPathVer++
    } else {
      path = await astar.findPath(start, end)
      tester.findPathVer++
    }
    const endTime = now()
    if (i % 2) {
      path = await astar.findPath(start, end)
      tester.findPathVer++
    } else {
      path2 = await tester.findPath(start, end)
      astar.findPathVer++
    }
    const endTime2 = now()

    results.push({
      path,
      time: i % 2 ? endTime2 - endTime : endTime - beginTime,
      path2,
      time2: i % 2 ? endTime - beginTime : endTime2 - endTime,
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
          ? `Tester found path with ${path2.length - 1} steps`
          : 'Found no path',
        showStats ? `(${open2} + ${update2} + ${close2})` : '',
        `in ${time2.toFixed(2)} ms.`
      )
    }
  }
  console.log(
    `Run ${times} times,`,
    `took ${(totalTime / times).toFixed(2)} ms in average.`,
    `Tester took ${(totalTime2 / times).toFixed(2)} ms in average.`
  )

  return results
}
