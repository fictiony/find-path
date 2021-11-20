import PathNode from './PathNode'
import AStarPathFinder from './AStarPathFinder'

export default async function benchmark (
  times = 1000, // run times
  size = 1000, // edge length of the square map
  ratio = 0.2 // ratio of the block grids
) {
  // prepare map and path finder
  const nodes = new Map()
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (Math.random() < ratio) continue
      nodes.set(PathNode.xyToId(x, y), new PathNode(x, y))
    }
  }
  const astar = new AStarPathFinder(id => nodes.get(id))
  const rand = () => Math.floor(Math.random() * size)

  // run tests
  const results = []
  let start, end
  for (let i = 0; i < times; i++) {
    do start = astar.getNodeAt(rand(), rand())
    while (!start)
    do end = astar.getNodeAt(rand(), rand())
    while (!end)
    const beginTime = performance ? performance.now() : Date.now()
    const path = await astar.findPath(start, end)
    const endTime = performance ? performance.now() : Date.now()
    results.push({ path, time: endTime - beginTime })
  }

  // output results
  let totalTime = 0
  for (let i = 0; i < times; i++) {
    const { path, time } = results[i]
    totalTime += time
    if (i < 100) {
      console.log(
        `#${i}:`,
        path ? `Found path with ${path.length} steps` : 'Found no path',
        `in ${time.toFixed(2)} ms.`
      )
    }
  }
  console.log(
    `Run ${times} times,`,
    `took ${(totalTime / times).toFixed(2)} ms in average.`
  )

  return results
}
