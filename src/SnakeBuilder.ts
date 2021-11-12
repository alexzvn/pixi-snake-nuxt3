import { createSquare } from './Snake';
import { SnakeNode, Position, Direction } from './SnakeInterface';

export function generateSnake(snake: SnakeNode): SnakeBuilder {
  return new SnakeBuilder(snake);
}

export class SnakeBuilder {
  private lastNode: SnakeNode

  constructor(private snake: SnakeNode) {
    this.lastNode = snake;
  }

  public add(node: Position, direction: Direction, color: number): SnakeBuilder {
    this.lastNode.next = {
      node,
      followDirection: direction,
      graphic: createSquare(node, color),
    }

    this.lastNode = this.lastNode.next

    return this;
  }

  public get(): SnakeNode {
    return this.snake;
  }
}

