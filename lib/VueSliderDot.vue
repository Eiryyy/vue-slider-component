<script lang="ts" setup>
import { Value, Styles, Position, TooltipProp, TooltipFormatter } from './typings'
import './styles/dot.scss'
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    value: Value
    tooltip: TooltipProp
    dotStyle?: Styles
    tooltipStyle?: Styles
    tooltipPlacement: Position
    tooltipFormatter?: TooltipFormatter
    focus: boolean
    disabled: boolean
  }>(),
  { value: 0, focus: false, disabled: false },
)
const emit = defineEmits<{
  (e: 'dragStart'): void
}>()
const dotRef = ref<HTMLDivElement>(null)
const showTooltip = computed(() => {
  switch (props.tooltip) {
    case 'always':
      return true
    case 'none':
      return false
    case 'focus':
    case 'active':
      return !!props.focus
    default:
      return false
  }
})

const dotClasses = computed(() => [
  'vue-slider-dot',
  {
    'vue-slider-dot-hover': props.tooltip === 'hover' || props.tooltip === 'active',
    'vue-slider-dot-disabled': props.disabled,
    'vue-slider-dot-focus': props.focus,
  },
])
const handleClasses = computed(() => [
  'vue-slider-dot-handle',
  {
    'vue-slider-dot-handle-disabled': props.disabled,
    'vue-slider-dot-handle-focus': props.focus,
  },
])
const tooltipClasses = computed(() => [
  'vue-slider-dot-tooltip',
  [`vue-slider-dot-tooltip-${props.tooltipPlacement}`],
  {
    'vue-slider-dot-tooltip-show': showTooltip.value,
  },
])
const tooltipInnerClasses = computed(() => [
  'vue-slider-dot-tooltip-inner',
  [`vue-slider-dot-tooltip-inner-${props.tooltipPlacement}`],
  {
    'vue-slider-dot-tooltip-inner-disabled': props.disabled,
    'vue-slider-dot-tooltip-inner-focus': props.focus,
  },
])

const tooltipValue = computed(() => {
  if (props.tooltipFormatter) {
    return typeof props.tooltipFormatter === 'string'
      ? props.tooltipFormatter.replace(/\{value\}/, String(props.value))
      : props.tooltipFormatter(props.value)
  } else {
    return props.value
  }
})
const dragStart = () => {
  if (props.disabled) {
    return false
  }
  emit('dragStart')
}
defineExpose({ dotRef })
</script>

<template>
  <div
    ref="dotRef"
    :class="dotClasses"
    :aria-valuetext="tooltipValue"
    @mousedown="dragStart"
    @touchstart="dragStart"
  >
    <slot name="dot">
      <div :class="handleClasses" :style="tooltipStyle" />
    </slot>
    <template v-if="tooltip !== 'none'">
      <div :class="tooltipClasses">
        <slot name="tooltip">
          <div :class="tooltipInnerClasses" :style="tooltipStyle">
            <span class="vue-slider-dot-tooltip-text">{{ tooltipValue }}</span>
          </div>
        </slot>
      </div>
    </template>
  </div>
</template>
