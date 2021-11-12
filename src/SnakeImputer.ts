import { Direction } from './SnakeInterface'

const { Up, Down, Left, Right } = Direction

export default class SnakeImputer {
  private latestDirection: Direction[] = []

  constructor() {
    window.addEventListener('keyup', (e) => this.listener(e))
  }

  protected listener(key: KeyboardEvent) {
    const direction = this.getDirection(key)

    if (direction) {
      this.collectDirection(direction)
    }
  }

  protected collectDirection(direction: Direction) {
    this.latestDirection.push(direction)

    if (this.latestDirection.length > 2) {
      this.latestDirection.shift()
    }
  }

  protected getDirection(event: KeyboardEvent): Direction | null {
    switch (event.key) {
      case 'ArrowUp':
        return Up
      case 'ArrowDown':
        return Down
      case 'ArrowLeft':
        return Left
      case 'ArrowRight':
        return Right
      default:
        return null
    }
  }

  public pull(): Direction | null {
    if (this.latestDirection.length === 0) {
      return null
    }

    return this.latestDirection.shift() || this.pull()
  }
}
