const random = () => {
  const coord = {}
  coord.x = Math.random() * 1280
  coord.y = Math.random() * 720
  return coord
}

export default random
