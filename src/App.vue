<template>
  <VueSlider v-model="value" :width="400"></VueSlider>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import VueSlider from '../lib/VueSlider.vue'
const value = ref(40)
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: hsl(210, 29%, 24%);
  margin: 100px auto;
}
</style>
