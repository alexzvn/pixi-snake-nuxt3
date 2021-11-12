import { defineNuxtPlugin } from '#app'
import Snake from '~/src/Snake'

export default defineNuxtPlugin(nuxt => { 
  nuxt.provide('snake', Snake)
})

declare module '#app' {
  interface NuxtApp {
    $snake: Snake
  }
}
