import { Graphics } from "pixi.js"

export type Position = {x: number, y: number}
export type AbsolutePosition = {x: number, y: number}
export enum Direction {
  Up = 1,
  Down = 2,
  Left = 3,
  Right = 4,
}

export type GameEvents = {
  tick?: undefined,
  over?: undefined,
  start?: undefined,
  eat?: undefined,
}

export enum GameState {
  Running,
  Over,
  Starting,
}

export interface Node {
  node: Position
}

export interface FoodNode extends Node {
  graphic: Graphics
}

export interface SnakeNode extends Node {
  graphic: Graphics,
  followDirection: Direction,
  next?: SnakeNode,
}
