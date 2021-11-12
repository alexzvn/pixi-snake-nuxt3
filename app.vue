<template>
  <div class="main">
    <div style="display: flex; justify-content: space-around;">
      <h1>Score: {{ score }}</h1>
      <h1 style="color: white">Best Score: {{ best }}</h1>
      <h1>State: 
        <span style="color: darkred;" v-if="over">Game Over</span>
        <span v-else>Running</span>
      </h1>
    </div>
    <div ref="screen">
    </div>

    <div style="display: flex">
      <button @click="() => snake.restart()" >Restart</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Snake from './src/Snake'

declare global {
  interface Window {
    snake: any,
  }
}

export default defineComponent({
  data () {
    return {
      snake: null as any as Snake,
      score: 0,
      over: false,
      best: 0,
    }
  },

  mounted() {
    const screen = this.$refs.screen as HTMLDivElement
    const snake  = new this.$snake(50, 26)

    window.snake = snake

    screen.appendChild(snake.domElement)

    this.snake = snake

    window.addEventListener('keyup', e => {
      if (/^Arrow/.test(e.key)) {
        this.snake.start()
      }
    })

    this.snake.on('start', () => {
      this.score = 0
      this.over = false
    })

    this.snake.on('eat', () => {
      this.score += 100

      this.best = this.score > this.best ? this.score : this.best
    })

    this.snake.on('over', () => {
      this.over = true
    })
  }
})
</script>

<style>
body { margin: 0; }

.main {
  display: grid;
  justify-content: center;
  align-content: center;
  min-height: 100vh;
}

body { background: gray; }
</style>
