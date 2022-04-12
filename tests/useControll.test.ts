import { assert, test } from 'vitest'
import { useControl } from '~/compositions/useControll'
import { ref, Ref } from 'vue'
import { Value } from '~/typings'
const getControl = (params?: {
  value?: Ref<number>
  data?: Ref<Value[] | undefined>
  enableCross?: Ref<boolean>
  fixed?: Ref<boolean>
  max?: Ref<number>
  min?: Ref<number>
  interval?: Ref<number>
  order?: Ref<boolean>
  maxRange?: Ref<number | undefined>
  minRange?: Ref<number | undefined>
}) =>
  useControl(
    params?.value || ref(0),
    params?.data || ref(undefined),
    params?.enableCross || ref(true),
    params?.fixed || ref(false),
    params?.max || ref(100),
    params?.min || ref(0),
    params?.interval || ref(1),
    params?.order || ref(true),
    params?.maxRange,
    params?.minRange,
    undefined,
    undefined,
    ref(true),
  )

test('Method: setDotPos', () => {
  const control = getControl()
  control.setDotPos(50, 0)
  assert.equal(control.dotsValue.value[0], 50)
})
test('Method: parseValue', () => {
  const control = getControl()
  const value = control.parseValue(50)
  assert.equal(value, 50)
})
test('Method: parsePos', () => {
  const control = getControl()
  const value = control.parsePos(50)
  assert.equal(value, 50)
})
test('Method: setValue & syncDotPos', () => {
  const control = getControl()
  control.setValue(50)
  assert.deepEqual(control.dotsPos.value, [50])
  control.setValue([0, 50])
  assert.deepEqual(control.dotsPos.value, [0, 50])
})
test('Method: getRecentDot', () => {
  const control = getControl()
  control.setValue([0, 100])
  assert.equal(control.getRecentDot(20), 0)
  assert.equal(control.getRecentDot(90), 1)
})
test('Method: getIndexByValue', () => {
  const interval = ref(1)
  const control = getControl({ interval })
  interval.value = 10
  assert.equal(control.getIndexByValue(20), 2)
  assert.equal(control.getIndexByValue(100), 10)
})
test('Method: getIndexByValue & getValueByIndex', () => {
  const interval = ref(1)
  const control = getControl({ interval })
  interval.value = 10
  assert.equal(control.getIndexByValue(20), 2)
  assert.equal(control.getValueByIndex(2), 20)
})
test('Method: isActiveByPos', () => {
  const control = getControl()
  control.setValue([0, 60])
  assert.equal(control.isActiveByPos(40), true)
  assert.equal(control.isActiveByPos(80), false)
})
test('Param: minRange', () => {
  const minRange = ref<number | undefined>(undefined)
  const control = getControl({ minRange })
  control.setValue([0, 100])
  minRange.value = 80
  control.setDotPos(70, 1)
  assert.equal(control.dotsValue.value[1], 80)
})
test('Param: maxRange', () => {
  const maxRange = ref<number | undefined>(undefined)
  const control = getControl({ maxRange })
  control.setValue([0, 20])
  maxRange.value = 50
  control.setDotPos(100, 1)
  assert.equal(control.dotsValue.value[0], 80)
})
test('Param: fixed', () => {
  const fixed = ref(false)
  const control = getControl({ fixed })
  control.setValue([0, 40])
  fixed.value = true
  control.setDotPos(30, 0)
  assert.equal(control.dotsValue.value[1], 70)
})
test('Param: order', () => {
  const order = ref(true)
  const control = getControl({ order })
  control.setValue([0, 40])
  order.value = false
  control.setDotPos(80, 0)
  assert.deepEqual(control.dotsValue.value, [80, 40])
})
