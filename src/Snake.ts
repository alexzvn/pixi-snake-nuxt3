import { Application, Graphics } from 'pixi.js'
import { generateSnake } from './SnakeBuilder'
import { AbsolutePosition, Direction, FoodNode, GameEvents, Position, SnakeNode, Node, GameState } from './SnakeInterface'
import mitt, { Emitter } from 'mitt'
import SnakeImputer from './SnakeImputer'

const SquareSize = 30 // pixels
const headColor = 0x1ab8e8
const bodyColor = 0x1581e6
const foodColor = 0xe6df19
const speed = 90 // ms

export const positionToAbsolute = (position: Position): AbsolutePosition => ({
  x: position.x * SquareSize,
  y: position.y * SquareSize
})

export const createSquare = (location: Position, color: number) => {
  const { x, y } = positionToAbsolute(location)

  const square = new Graphics()
  square.beginFill(color)
  square.drawRect(0, 0, SquareSize, SquareSize)
  square.endFill()

  square.position.set(x, y)

  return square
}

const snakeLooper = (snake: SnakeNode, callback: (snake: SnakeNode) => void) => {
  callback(snake)
  if (snake.next) snakeLooper(snake.next, callback)
}

const moveToDirection = (node: SnakeNode, direction: Direction, invert = false) => {
  const { Up, Down, Left, Right } = Direction

  if (direction === Up || direction === Down) {
    node.node.y += invert ? (direction === Up ? 1 : -1) : (direction === Up ? -1 : 1);
  }

  if (direction === Left || direction === Right) {
    node.node.x += invert ? (direction === Left ? 1 : -1) : (direction === Left ? -1 : 1);
  }
}

const moveToDirectionPercent = (node: Node, direction: Direction, percent: number) => {
  const { Up, Down, Left, Right } = Direction

  if (direction === Up || direction === Down) {
    node.node.y += (direction === Up ? -1 : 1) * percent
  }

  if (direction === Left || direction === Right) {
    node.node.x += (direction === Left ? -1 : 1) * percent
  }
}

const appendTail = (snake: SnakeNode) => {
  while (snake.next) {
    snake = snake.next
  }

  const tail: SnakeNode = {
    node: {
      x: snake.node.x,
      y: snake.node.y
    },
    graphic: createSquare(snake.node, bodyColor),
    followDirection: snake.followDirection,
  }

  moveToDirection(tail, tail.followDirection, true)

  snake.next = tail

  return tail
}

const wallChecker = (snake: SnakeNode, col: number, row: number) => {
  let isInsideBody = false
  const isInsideWall = snake.node.x < 0 || snake.node.x >= col || snake.node.y < 0 || snake.node.y >= row

  snakeLooper(snake.next!, body => {
    if (isSamePosition(body.node, snake.node)) isInsideBody = true
  })

  return isInsideBody || isInsideWall
}

const isSamePosition = (a: Position, b: Position) => a.x === b.x && a.y === b.y
const invertDirection = (direction: Direction) => {
  const { Up, Down, Left, Right } = Direction

  if (direction === Up) return Down
  if (direction === Down) return Up
  if (direction === Left) return Right
  if (direction === Right) return Left
}

const isSameAxis = (a: Direction, b: Direction) => a === b || a === invertDirection(b)

export default class Snake {
  public readonly app: Application

  private state = GameState.Starting

  private emitter = mitt<GameEvents>()
  private snake?: SnakeNode
  private food?: FoodNode
  private ticker: any
  private input = new SnakeImputer
  private currentFrame = 0

  constructor(public readonly col: number, public readonly row: number) {
    this.app = new Application({
      width: col * SquareSize,
      height: row * SquareSize,
    });

    this.init()
  }

  protected init() {
    const [food, snake] = [this.generateFood(), this.generateInitSnake()]

    this.app.stage.addChild(food.graphic)

    snakeLooper(snake, (snake) => {
      this.app.stage.addChild(snake.graphic)
    })
  }

  public start() {
    if (this.state === GameState.Over || this.state === GameState.Running) return

    this.ticker = setInterval(() => this.tick(), speed)
    this.state = GameState.Running

    this.emitter.emit('start')

    this.tick()
  }

  restart() {
    this.app.stage.removeChildren()
    this.init()
    this.state = GameState.Starting
  }

  protected over() {
    clearInterval(this.ticker)
    this.state = GameState.Over
  }

  protected tick() {
    this.emitter.emit('tick')

    const d = this.input.pull()

    // Move snake to new position
    let direction = d || this.snake!.followDirection

    if (isSameAxis(direction, this.snake!.followDirection)) {
      direction = this.snake!.followDirection
    }

    this.snake!.followDirection = direction

    snakeLooper(this.snake!, (snake) => {
      const follow = snake.followDirection
      snake.followDirection = direction
      direction = follow

      moveToDirection(snake, direction)
    })

    // on eat food
    if (isSamePosition(this.snake!.node, this.food!.node)) {
      this.emitter.emit('eat')

      this.app.stage.removeChild(this.food!.graphic)
      this.generateFood()
      this.app.stage.addChild(this.food!.graphic)

      const tail = appendTail(this.snake!)
      this.app.stage.addChild(tail.graphic)
    }

    if (wallChecker(this.snake!, this.col, this.row)) {
      this.emitter.emit('over')
      this.over()
    }

    this.render(speed)
  }

  public on(event: keyof GameEvents, handler: (value: GameEvents[keyof GameEvents]) => any) {
    this.emitter.on(event as any, handler)
  }

  protected async render(duration: number) {
    this.renderNode(positionToAbsolute(this.food!.node), this.food!.graphic)

    const antiOutSync = 3 // ms
    const delay = 1000 / this.app.ticker.FPS // ms per frame
    let total = duration / delay // total frames

    for (let i = 1; i <= total; i++) {
      await this.renderFrame(i/total, delay - antiOutSync, ++this.currentFrame)
    }
  }

  protected async renderFrame(percent: number, delay: number, id: number) {
    console.log(percent, delay)

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    await sleep(delay)

    if (id < this.currentFrame) {
      return // drop frame when out of sync
    }

    snakeLooper(this.snake!, (snake) => {
      const simulatorNode = {
        node: { ...snake.node }
      }

      moveToDirectionPercent(simulatorNode, snake.followDirection, percent)

      this.renderNode(positionToAbsolute(simulatorNode.node), snake.graphic)
    })
  }

  renderNode(position: AbsolutePosition, square: Graphics) {
    square.position.set(position.x, position.y)
  }

  private generateFood() {
    const x = Math.floor(Math.random() * this.col)
    const y = Math.floor(Math.random() * this.row)

    return this.food = {
      node: { x, y },
      graphic: createSquare({ x, y }, foodColor)
    }
  }

  private generateInitSnake() {
    const color = bodyColor

    return this.snake = generateSnake({
        node: { x: 3, y: 0 },
        followDirection: Direction.Right,
        graphic: new Graphics
      })
      .add({ x: 2, y: 0 }, Direction.Right, headColor)
      .add({ x: 1, y: 0 }, Direction.Right, color)
      .add({ x: 0, y: 0 }, Direction.Right, color)
      .get()
  }

  get domElement() {
    return this.app.view;
  }
}
