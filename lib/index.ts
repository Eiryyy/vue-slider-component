/* tslint:disable:import-spacing */
import VueSlider from './VueSlider.vue'
import VueSliderMark from './VueSliderMark.vue'
import VueSliderDot from './VueSliderDot.vue'
import { ERROR_TYPE } from './compositions/useControll'
;(VueSlider as any).VueSliderMark = VueSliderMark
;(VueSlider as any).VueSliderDot = VueSliderDot

export default VueSlider
export { ERROR_TYPE, VueSliderMark, VueSliderDot }
