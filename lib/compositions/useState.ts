import { computed, ref } from 'vue'

export const SliderState = {
  None: 0,
  Drag: 1 << 1,
  Focus: 1 << 2,
}
export const useState = () => {
  const states = ref(0)
  const hasState = (state: number) => !!(states.value & state)
  const addState = (state: number) => {
    states.value |= state
  }
  const deleteState = (state: number) => {
    states.value &= ~state
  }
  const toggleState = (state: number) => {
    if (hasState(state)) {
      deleteState(state)
    } else {
      addState(state)
    }
  }
  const hasDrag = computed(() => hasState(SliderState.Drag))
  const hasFocus = computed(() => hasState(SliderState.Focus))
  return {
    addState,
    deleteState,
    toggleState,
    hasDrag,
    hasFocus,
  }
}
