<script lang="ts" setup>
import {
  Value,
  DataObject,
  Mark,
  MarksProp,
  Styles,
  DotOption,
  Dot,
  Direction,
  Position,
  ProcessProp,
  TooltipProp,
  TooltipFormatter,
} from './typings'
import VueSliderDot from './VueSliderDot.vue'
import VueSliderMark from './VueSliderMark.vue'
import { getSize, getPos, getKeyboardHandleFunc, HandleFunction } from './utils'
import Decimal from './utils/decimal'
import './styles/slider.scss'
import { computed, onBeforeUnmount, onBeforeUpdate, onMounted, ref, toRef, watch } from 'vue'
import { useControl, ERROR_TYPE } from './compositions/useControll'
import { useState, SliderState } from './compositions/useState'
type ValueOf<T> = T[keyof T]
const DEFAULT_SLIDER_SIZE = 4

const props = withDefaults(
  defineProps<{
    modelValue: string | number | (string | number)[]
    silent?: boolean
    direction?: Direction
    width?: number | string
    height?: number | string
    dotSize?: [number, number] | number
    contained?: boolean
    min?: number
    max?: number
    interval?: number
    disabled?: boolean
    clickable?: boolean
    dragOnClick?: boolean
    duration?: number
    vData?: Value[] | object[] | DataObject
    dataValue?: string
    dataLabel?: string
    lazy?: boolean
    tooltip?: TooltipProp
    tooltipPlacement?: Position | Position[]
    tooltipFormatter?: TooltipFormatter | TooltipFormatter[]
    useKeyboard?: boolean
    keydownHook?: (e: KeyboardEvent) => HandleFunction | boolean
    enableCross?: boolean
    fixed?: boolean
    order?: boolean
    minRange?: number
    maxRange?: number
    marks?: MarksProp
    process?: ProcessProp
    included?: boolean
    adsorb?: boolean
    hideLabel?: boolean
    dotOptions?: DotOption | DotOption[]
    dotAttrs?: object
    railStyle?: Styles
    processStyle?: Styles
    dotStyle?: Styles
    tooltipStyle?: Styles
    stepStyle?: Styles
    stepActiveStyle?: Styles
    labelStyle?: Styles
    labelActiveStyle?: Styles
  }>(),
  {
    silent: false,
    direction: 'ltr',
    dotSize: 14,
    contained: false,
    min: 0,
    max: 100,
    interval: 1,
    disabled: false,
    clickable: true,
    dragOnClick: false,
    duration: 0.5,
    dataValue: 'value',
    dataLabel: 'label',
    lazy: false,
    tooltip: 'active',
    useKeyboard: true,
    enableCross: true,
    fixed: false,
    order: true,
    marks: true,
    process: true,
  },
)
const emit = defineEmits<{
  (e: 'error', type: ValueOf<typeof ERROR_TYPE>, message: string): void
  (e: 'change', newValue: Value | Value[], focusDotIndex: number): void
  (e: 'update:modelValue', value: Value | Value[]): void
  (e: 'dragStart', focusDotIndex: number): void
  (e: 'dragging', value: Value | Value[], focusDotIndex: number): void
  (e: 'dragEnd', focusDotIndex: number): void
}>()
const containerRef = ref<HTMLDivElement>(null)
const sliderDotRefs = ref<InstanceType<typeof VueSliderDot>[]>([])
/*
const setSliderDotRef = (component?: InstanceType<typeof VueSliderDot>) => {
  if (component) {
    sliderDotRefs.value.push(component as InstanceType<typeof VueSliderDot>)
  }
}
*/
onBeforeUpdate(() => {
  sliderDotRefs.value = []
})
const { addState, deleteState, hasDrag, hasFocus } = useState()
const focusDotIndex = ref(0)
const scale = ref(1)
const isObjectData = (data?: Value[] | object[] | DataObject): data is DataObject =>
  !!data && Object.prototype.toString.call(data) === '[object Object]'

const isObjectArrayData = (data?: Value[] | object[] | DataObject): data is object[] =>
  !!data && Array.isArray(data) && data.length > 0 && typeof data[0] === 'object'

const sliderData = computed((): undefined | Value[] => {
  if (isObjectArrayData(props.vData)) {
    return (props.vData as any[]).map((obj) => obj[props.dataValue])
  } else if (isObjectData(props.vData)) {
    return Object.keys(props.vData)
  } else {
    return props.vData as Value[]
  }
})

const sliderMarks = computed((): undefined | MarksProp => {
  if (props.marks) {
    return props.marks
  } else if (isObjectArrayData(props.vData)) {
    return (val) => {
      const mark = { label: val }
      ;(props.vData as any[]).some((obj) => {
        if (obj[props.dataValue] === val) {
          mark.label = obj[props.dataLabel]
          return true
        }
        return false
      })
      return mark
    }
  } else if (isObjectData(props.vData)) {
    return props.vData
  }
  return undefined
})

const emitError = (type: ValueOf<typeof ERROR_TYPE>, message: string) => {
  if (!props.silent) {
    console.error(`[VueSlider error]: ${message}`)
  }
  emit('error', type, message)
}
const control = useControl(
  toRef(props, 'modelValue'),
  sliderData,
  toRef(props, 'enableCross'),
  toRef(props, 'fixed'),
  toRef(props, 'min'),
  toRef(props, 'max'),
  toRef(props, 'interval'),
  toRef(props, 'order'),
  toRef(props, 'minRange'),
  toRef(props, 'maxRange'),
  toRef(props, 'marks'),
  toRef(props, 'included'),
  toRef(props, 'process'),
  toRef(props, 'adsorb'),
  toRef(props, 'dotOptions'),
  emitError,
)

const isHorizontal = computed(() => props.direction === 'ltr' || props.direction === 'rtl')
const isReverse = computed(() => props.direction === 'rtl' || props.direction === 'btt')
const mainDirection = computed(() => {
  switch (props.direction) {
    case 'ltr':
      return 'left'
    case 'rtl':
      return 'right'
    case 'btt':
      return 'bottom'
  }
  return 'top'
})

const containerClasses = computed(() => [
  'vue-slider',
  [`vue-slider-${props.direction}`],
  {
    'vue-slider-disabled': props.disabled,
  },
])

const containerStyles = computed(() => {
  const [dotWidth, dotHeight] = Array.isArray(props.dotSize)
    ? props.dotSize
    : [props.dotSize, props.dotSize]
  const containerWidth = props.width
    ? getSize(props.width)
    : isHorizontal.value
    ? 'auto'
    : getSize(DEFAULT_SLIDER_SIZE)
  const containerHeight = props.height
    ? getSize(props.height)
    : isHorizontal.value
    ? getSize(DEFAULT_SLIDER_SIZE)
    : 'auto'
  return {
    padding: props.contained
      ? `${dotHeight / 2}px ${dotWidth / 2}px`
      : isHorizontal.value
      ? `${dotHeight / 2}px 0`
      : `0 ${dotWidth / 2}px`,
    width: containerWidth,
    height: containerHeight,
  }
})

const tailSize = computed(() =>
  getSize((isHorizontal.value ? props.height : props.width) || DEFAULT_SLIDER_SIZE),
)

const animateTime = computed(() => {
  if (hasDrag.value) {
    return 0
  }
  return props.duration
})

const processArray = computed(() =>
  control.processArray.value.map(([start, end, style], index) => {
    if (start > end) {
      ;[start, end] = [end, start]
    }
    const sizeStyleKey = isHorizontal.value ? 'width' : 'height'
    return {
      start,
      end,
      index,
      style: {
        [isHorizontal.value ? 'height' : 'width']: '100%',
        [isHorizontal.value ? 'top' : 'left']: 0,
        [mainDirection.value]: `${start}%`,
        [sizeStyleKey]: `${end - start}%`,
        transitionProperty: `${sizeStyleKey},${mainDirection.value}`,
        transitionDuration: `${animateTime.value}s`,
        ...props.processStyle,
        ...style,
      },
    }
  }),
)

const dotBaseStyle = computed(() => {
  const [dotWidth, dotHeight] = Array.isArray(props.dotSize)
    ? props.dotSize
    : [props.dotSize, props.dotSize]
  let dotPos: Record<string, string>
  if (isHorizontal.value) {
    dotPos = {
      transform: `translate(${isReverse.value ? '50%' : '-50%'}, -50%)`,
      WebkitTransform: `translate(${isReverse.value ? '50%' : '-50%'}, -50%)`,
      top: '50%',
      [props.direction === 'ltr' ? 'left' : 'right']: '0',
    }
  } else {
    dotPos = {
      transform: `translate(-50%, ${isReverse.value ? '50%' : '-50%'})`,
      WebkitTransform: `translate(-50%, ${isReverse.value ? '50%' : '-50%'})`,
      left: '50%',
      [props.direction === 'btt' ? 'bottom' : 'top']: '0',
    }
  }
  return {
    width: `${dotWidth}px`,
    height: `${dotHeight}px`,
    ...dotPos,
  }
})

const dots = computed(() =>
  control.dotsPos.value.map((pos, index) => ({
    pos,
    index,
    value: control.dotsValue.value[index],
    focus: hasFocus.value && focusDotIndex.value === index,
    disabled: props.disabled,
    style: props.dotStyle,
    ...((Array.isArray(props.dotOptions) ? props.dotOptions[index] : props.dotOptions) || {}),
  })),
)

const tooltipDirections = computed(() => {
  const dir = props.tooltipPlacement || (isHorizontal.value ? 'top' : 'left')
  if (Array.isArray(dir)) {
    return dir
  } else {
    return dots.value.map(() => dir)
  }
})

const canSort = computed(
  () => props.order && !props.minRange && !props.maxRange && !props.fixed && props.enableCross,
)

const sliderTooltipFormatter = computed((): undefined | TooltipFormatter | TooltipFormatter[] => {
  if (props.tooltipFormatter) {
    return props.tooltipFormatter
  } else if (isObjectArrayData(props.vData)) {
    return (val) => {
      let tooltipText = '' + val
      ;(props.vData as any[]).some((obj) => {
        if (obj[props.dataValue] === val) {
          tooltipText = obj[props.dataLabel]
          return true
        }
        return false
      })
      return tooltipText
    }
  } else if (isObjectData(props.vData)) {
    const data = props.vData
    return (val) => data[val]
  }
  return undefined
})

const isNotSync = computed(() => {
  const values = control.dotsValue
  return Array.isArray(props.modelValue)
    ? props.modelValue.length !== values.value.length ||
        props.modelValue.some((val, index) => val !== values.value[index])
    : props.modelValue !== values.value[0]
})

watch(toRef(props, 'modelValue'), (newValue) => {
  if (!hasDrag.value && isNotSync.value) {
    control.setValue(newValue)
  }
})

const isDiff = (value1: Value[], value2: Value[]) =>
  value1.length !== value2.length || value1.some((val, index) => val !== value2[index])

const syncValueByPos = () => {
  const values = control.dotsValue
  if (
    isDiff(values.value, Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue])
  ) {
    const newValue = values.value.length === 1 ? values.value[0] : [...values.value]
    emit('change', newValue, focusDotIndex.value)
    emit('update:modelValue', newValue)
  }
}

const dragRange = computed((): [number, number] => {
  const prevDot = dots.value[focusDotIndex.value - 1]
  const nextDot = dots.value[focusDotIndex.value + 1]
  return [prevDot ? prevDot.pos : -Infinity, nextDot ? nextDot.pos : Infinity]
})

const setScale = () => {
  if (!containerRef.value) {
    return
  }
  scale.value = new Decimal(
    Math.floor(
      isHorizontal.value ? containerRef.value.offsetWidth : containerRef.value.offsetHeight,
    ),
  )
    .divide(100)
    .toNumber()
}

const getPosByEvent = (e: MouseEvent | TouchEvent) =>
  getPos(e, containerRef.value!, isReverse.value)[isHorizontal.value ? 'x' : 'y'] / scale.value

const isCrossDot = (pos: number) => {
  if (canSort.value) {
    const curIndex = focusDotIndex.value
    let curPos = pos
    if (curPos > dragRange.value[1]) {
      curPos = dragRange.value[1]
      focusDotIndex.value++
    } else if (curPos < dragRange.value[0]) {
      curPos = dragRange.value[0]
      focusDotIndex.value--
    }
    if (curIndex !== focusDotIndex.value) {
      const dotComponent = sliderDotRefs.value[focusDotIndex.value]
      dotComponent?.dotRef.focus()
      control.setDotPos(curPos, curIndex)
    }
  }
}

const dragStart = (index: number) => {
  focusDotIndex.value = index
  setScale()
  addState(SliderState.Drag)
  addState(SliderState.Focus)
  emit('dragStart', focusDotIndex.value)
}

const dragMove = (e: MouseEvent | TouchEvent) => {
  if (!hasDrag.value) {
    return false
  }
  e.preventDefault()
  const pos = getPosByEvent(e)
  isCrossDot(pos)
  control.setDotPos(pos, focusDotIndex.value)
  if (!props.lazy) {
    syncValueByPos()
  }
  const value = control.dotsValue
  emit(
    'dragging',
    value.value.length === 1 ? value.value[0] : [...value.value],
    focusDotIndex.value,
  )
}

const dragEnd = (e: MouseEvent | TouchEvent) => {
  if (!hasDrag.value) {
    return false
  }
  setTimeout(() => {
    if (props.lazy) {
      syncValueByPos()
    }
    if (props.included && isNotSync.value) {
      control.setValue(props.modelValue)
    } else {
      // Sync slider position
      control.syncDotsPos()
    }
    deleteState(SliderState.Drag)
    // If useKeyboard is true, keep focus status after dragging
    if (!props.useKeyboard || 'targetTouches' in e) {
      deleteState(SliderState.Focus)
    }
    emit('dragEnd', focusDotIndex.value)
  })
}

const dragStartOnProcess = (e: MouseEvent | TouchEvent) => {
  if (props.dragOnClick) {
    setScale()
    const pos = getPosByEvent(e)
    const index = control.getRecentDot(pos)
    if (dots.value[index].disabled) {
      return
    }
    dragStart(index)
    control.setDotPos(pos, focusDotIndex.value)
    if (!props.lazy) {
      syncValueByPos()
    }
  }
}

const focus = (dot: Dot, index: number = 0) => {
  if (dot.disabled) {
    return
  }
  addState(SliderState.Focus)
  focusDotIndex.value = index
}

const blur = () => {
  deleteState(SliderState.Focus)
}

const getValue = () => {
  const values = control.dotsValue
  return values.value.length === 1 ? values.value[0] : values.value
}

const setValueByPos = (pos: number) => {
  const index = control.getRecentDot(pos)
  if (props.disabled || dots.value[index].disabled) {
    return false
  }
  focusDotIndex.value = index
  control.setDotPos(pos, index)
  syncValueByPos()

  if (props.useKeyboard) {
    addState(SliderState.Focus)
  }

  setTimeout(() => {
    if (props.included && isNotSync.value) {
      control.setValue(props.modelValue)
    } else {
      control.syncDotsPos()
    }
  })
}

const blurHandle = (e: MouseEvent) => {
  if (!hasFocus.value || !containerRef.value || containerRef.value.contains(e.target as Node)) {
    return false
  }
  deleteState(SliderState.Focus)
}

const clickHandle = (e: MouseEvent | TouchEvent) => {
  ;``
  if (!props.clickable || props.disabled) {
    return false
  }
  if (hasDrag.value) {
    return
  }
  setScale()
  setValueByPos(getPosByEvent(e))
}

const keydownHandle = (e: KeyboardEvent) => {
  if (!props.useKeyboard || !hasFocus.value) {
    return false
  }

  const isInclude = props.included && props.marks
  const handleFunc = getKeyboardHandleFunc(e, {
    direction: props.direction,
    max: isInclude ? control.markList.value.length - 1 : control.total.value,
    min: 0,
    hook: props.keydownHook,
  })

  if (handleFunc) {
    e.preventDefault()
    let newIndex = -1
    let pos = 0
    if (isInclude) {
      control.markList.value.some((mark, index) => {
        if (mark.value === control.dotsValue.value[focusDotIndex.value]) {
          newIndex = handleFunc(index)
          return true
        }
        return false
      })
      if (newIndex < 0) {
        newIndex = 0
      } else if (newIndex > control.markList.value.length - 1) {
        newIndex = control.markList.value.length - 1
      }
      pos = control.markList.value[newIndex].pos
    } else {
      newIndex = handleFunc(control.getIndexByValue(control.dotsValue.value[focusDotIndex.value]))
      pos = control.parseValue(control.getValueByIndex(newIndex))
    }
    isCrossDot(pos)
    control.setDotPos(pos, focusDotIndex.value)
    syncValueByPos()
  }
}

onMounted(() => {
  document.addEventListener('touchmove', dragMove, { passive: false })
  document.addEventListener('touchend', dragEnd, { passive: false })
  document.addEventListener('mousedown', blurHandle)
  document.addEventListener('mousemove', dragMove)
  document.addEventListener('mouseup', dragEnd)
  document.addEventListener('mouseleave', dragEnd)
  document.addEventListener('keydown', keydownHandle)
})

onBeforeUnmount(() => {
  document.removeEventListener('touchmove', dragMove)
  document.removeEventListener('touchend', dragEnd)
  document.removeEventListener('mousedown', blurHandle)
  document.removeEventListener('mousemove', dragMove)
  document.removeEventListener('mouseup', dragEnd)
  document.removeEventListener('mouseleave', dragEnd)
  document.removeEventListener('keydown', keydownHandle)
})

const markList = control.markList

const getMarkStyle = (mark: Mark) => ({
  [isHorizontal.value ? 'height' : 'width']: '100%',
  [isHorizontal.value ? 'width' : 'height']: tailSize.value,
  [mainDirection.value]: `${mark.pos}%`,
})
const getDotStyle = (dot: Dot) => [
  dotBaseStyle.value,
  {
    [mainDirection.value]: `${dot.pos}%`,
    transition: `${mainDirection.value} ${animateTime.value}s`,
  },
]
</script>

<template>
  <div
    ref="containerRef"
    :class="containerClasses"
    :style="containerStyles"
    @click="clickHandle"
    @touchstart="dragStartOnProcess"
    @mousedown="dragStartOnProcess"
  >
    <div class="vue-slider-rail" :style="railStyle">
      <template v-for="(process, i) in processArray">
        <slot name="process" v-bind="process">
          <div class="vue-slider-process" :key="`process-${i}`" :style="process.style" />
        </slot>
      </template>
      <div v-if="sliderMarks" class="vue-slider-marks">
        <template v-for="(mark, i) in markList">
          <slot name="mark" v-bind="mark">
            <VueSliderMark
              :key="`mark-${i}`"
              :mark="mark"
              :hide-label="hideLabel"
              :style="getMarkStyle(mark)"
              :step-style="stepStyle"
              :step-active-style="stepActiveStyle"
              :label-style="labelStyle"
              :label-active-style="labelActiveStyle"
              @press-label="(pos: number) => clickable && setValueByPos(pos)"
            >
              <template #step>
                <slot name="step" />
              </template>
              <template #label>
                <slot name="label" />
              </template>
            </VueSliderMark>
          </slot>
        </template>
      </div>
      <VueSliderDot
        v-for="(dot, i) in dots"
        :key="`dot-${i}`"
        ref="sliderDotRefs"
        :value="dot.value"
        :disabled="dot.disabled"
        :focus="dot.focus"
        :dot-style="[
          dot.style,
          dot.disabled ? dot.disabledStyle : null,
          dot.focus ? dot.focusStyle : null,
        ]"
        :tooltip="dot.tooltip || tooltip"
        :tooltip-style="[
          tooltipStyle,
          dot.tooltipStyle,
          dot.disabled ? dot.tooltipDisabledStyle : null,
          dot.focus ? dot.tooltipFocusStyle : null,
        ]"
        :tooltip-formatter="
          Array.isArray(sliderTooltipFormatter) ? sliderTooltipFormatter[i] : sliderTooltipFormatter
        "
        :tooltip-placement="tooltipDirections[i]"
        :style="getDotStyle(dot)"
        @drag-start="() => dragStart(i)"
        role="slider"
        :aria-valuenow="dot.value"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-orientation="isHorizontal ? 'horizontal' : 'vertical'"
        tabindex="0"
        @focus="() => focus(dot, i)"
        @blur="blur"
        v-bind="dotAttrs"
      >
        <template #dot>
          <slot name="dot" />
        </template>
        <template #tooltip>
          <slot name="tooltip" />
        </template>
      </VueSliderDot>
      <slot :value="getValue" />
    </div>
  </div>
</template>
