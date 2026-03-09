const ADJECTIVES = ['swift', 'bright', 'calm', 'eager', 'fierce', 'gentle', 'happy', 'jolly', 'kind', 'lively', 'merry', 'noble', 'proud', 'quick', 'brave', 'clever', 'daring', 'fancy', 'grand', 'witty']
const ANIMALS = ['fox', 'owl', 'bear', 'wolf', 'hawk', 'deer', 'lynx', 'seal', 'crow', 'dove', 'frog', 'hare', 'ibis', 'kite', 'lark', 'mole', 'newt', 'puma', 'wren', 'yak']

export function generateUsername(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return `${adj}-${animal}`
}

export function generateColor(): string {
  const hue = Math.floor(Math.random() * 360)
  return `hsl(${hue}, 70%, 60%)`
}
