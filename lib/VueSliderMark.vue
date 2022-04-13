<script lang="ts" setup>
import { Mark, Styles } from './typings'

import './styles/mark.scss'
import { computed } from 'vue'

const props = defineProps<{
  mark: Mark
  hideLabel?: boolean
  stepStyle?: Styles
  stepActiveStyle?: Styles
  labelStyle?: Styles
  labelActiveStyle?: Styles
}>()
const emit = defineEmits<{ (e: 'pressLabel', pos: Mark['pos']): void }>()
const marksClasses = computed(() => [
  'vue-slider-mark',
  {
    'vue-slider-mark-active': props.mark.active,
  },
])

const stepClasses = computed(() => [
  'vue-slider-mark-step',
  {
    'vue-slider-mark-step-active': props.mark.active,
  },
])

const labelClasses = computed(() => [
  'vue-slider-mark-label',
  {
    'vue-slider-mark-label-active': props.mark.active,
  },
])

const labelClickHandle = (e: MouseEvent | TouchEvent) => {
  e.stopPropagation()
  emit('pressLabel', props.mark.pos)
}
</script>

<template>
  <div :class="marksClasses">
    <slot name="step" v-bind="mark">
      <div
        :class="stepClasses"
        :style="[
          stepStyle,
          mark.style,
          mark.active ? props.stepActiveStyle : null,
          mark.active ? mark.activeStyle : null,
        ]"
      />
    </slot>
    <template v-if="!hideLabel">
      <slot name="label" v-bind="mark">
        <div
          :class="labelClasses"
          :style="[
            labelStyle,
            mark.labelStyle,
            mark.active ? props.labelActiveStyle : null,
            mark.active ? mark.labelActiveStyle : null,
          ]"
          @click="labelClickHandle"
        >
          {{ mark.label }}
        </div>
      </slot>
    </template>
  </div>
</template>
