import Decimal from '../utils/decimal'
import {
  Value,
  Mark,
  MarkOption,
  Marks,
  MarksProp,
  ProcessProp,
  ProcessOption,
  MarksFunction,
  DotOption,
} from '../typings'
import { computed, ref, Ref } from 'vue'

// The distance each slider changes
type DotsPosChangeArray = number[]

export const ERROR_TYPE = {
  VALUE: 1,
  INTERVAL: 2,
  MIN: 3,
  MAX: 4,
  ORDER: 5,
} as const
type ValueOf<T> = T[keyof T]
type ERROR_MESSAGE = Record<ValueOf<typeof ERROR_TYPE>, string>
export const ERROR_MSG: ERROR_MESSAGE = {
  [ERROR_TYPE.VALUE]: 'The type of the "value" is illegal',
  [ERROR_TYPE.INTERVAL]:
    'The prop "interval" is invalid, "(max - min)" must be divisible by "interval"',
  [ERROR_TYPE.MIN]: 'The "value" must be greater than or equal to the "min".',
  [ERROR_TYPE.MAX]: 'The "value" must be less than or equal to the "max".',
  [ERROR_TYPE.ORDER]:
    'When "order" is false, the parameters "minRange", "maxRange", "fixed", "enabled" are invalid.',
}

export const useControl = (
  value: Ref<Value | Value[]>,
  data: Ref<Value[] | undefined>,
  _enableCross: Ref<boolean>,
  _fixed: Ref<boolean>,
  max: Ref<number>,
  min: Ref<number>,
  interval: Ref<number>,
  order: Ref<boolean>,
  _maxRange?: Ref<number | undefined>,
  _minRange?: Ref<number | undefined>,
  marks?: Ref<MarksProp>,
  included?: Ref<boolean>,
  process?: Ref<ProcessProp>,
  adsorb?: Ref<boolean>,
  dotOptions?: Ref<DotOption | DotOption[]>,
  onError?: (type: ValueOf<typeof ERROR_TYPE>, message: string) => void,
) => {
  const dotsPos = ref<number[]>([])
  const dotsValue = ref<Value[]>([])
  const emitError = (type: ValueOf<typeof ERROR_TYPE>) => {
    onError?.(type, ERROR_MSG[type])
  }
  const maxRange = computed(() => (order.value ? _maxRange?.value || 0 : 0))
  const minRange = computed(() => (order.value ? _minRange?.value || 0 : 0))
  const enableCross = computed(() => (order.value ? _enableCross.value : true))
  const fixed = computed(() => (order.value ? _fixed.value : false))
  if (
    (order.value && _maxRange?.value) ||
    _minRange?.value ||
    !_enableCross.value ||
    _fixed.value
  ) {
    emitError(ERROR_TYPE.ORDER)
  }

  const total = computed(() => {
    let total = 0
    if (data.value) {
      total = data.value.length - 1
    } else {
      total = new Decimal(max.value).minus(min.value).divide(interval.value).toNumber()
    }
    if (total - Math.floor(total) !== 0) {
      emitError(ERROR_TYPE.INTERVAL)
      return 0
    }
    return total
  })
  const gap = computed(() => 100 / total.value)

  const parseValue = (val: Value) => {
    if (data.value) {
      val = data.value.indexOf(val)
    } else if (typeof val === 'number' || typeof val === 'string') {
      val = +val
      if (val < min.value) {
        emitError(ERROR_TYPE.MIN)
        return 0
      }
      if (val > max.value) {
        emitError(ERROR_TYPE.MAX)
        return 0
      }
      if (typeof val !== 'number' || val !== val) {
        emitError(ERROR_TYPE.VALUE)
        return 0
      }
      val = new Decimal(val).minus(min.value).divide(interval.value).toNumber()
    }

    const pos = new Decimal(val).multiply(gap.value).toNumber()
    return pos < 0 ? 0 : pos > 100 ? 100 : pos
  }

  const syncDotsPos = () => {
    dotsPos.value = dotsValue.value.map((v) => parseValue(v))
  }

  const setDotsValue = (value: Value[], syncPos?: boolean) => {
    dotsValue.value = value
    if (syncPos) {
      syncDotsPos()
    }
  }

  const setValue = (value: Value | Value[]) => {
    setDotsValue(Array.isArray(value) ? [...value] : [value], true)
  }
  setValue(value.value)

  const setDotsPos = (_dotsPos: number[]) => {
    const list = order.value ? [..._dotsPos].sort((a, b) => a - b) : _dotsPos
    dotsPos.value = _dotsPos
    setDotsValue(
      list.map((dotPos) => getValueByPos(dotPos)),
      adsorb?.value,
    )
  }

  const parsePos = (pos: number) => {
    const index = Math.round(pos / gap.value)
    return getValueByIndex(index)
  }

  const getValueByIndex = (index: number): Value => {
    if (index < 0) {
      index = 0
    } else if (index > total.value) {
      index = total.value
    }
    return data.value
      ? data.value[index]
      : new Decimal(index).multiply(interval.value).plus(min.value).toNumber()
  }

  const getValueByPos = (pos: number) => {
    let value = parsePos(pos)
    if (included?.value) {
      let dir = 100
      markList.value.forEach((mark) => {
        const curDir = Math.abs(mark.pos - pos)
        if (curDir < dir) {
          dir = curDir
          value = mark.value
        }
      })
    }
    return value
  }

  const getValues = () => {
    if (data.value) {
      return data.value
    } else {
      const values: Value[] = []
      for (let i = 0; i <= total.value; i++) {
        values.push(new Decimal(i).multiply(interval.value).plus(min.value).toNumber())
      }
      return values
    }
  }

  const isActiveByPos = (pos: number) =>
    processArray.value.some(([start, end]) => pos >= start && pos <= end)

  const processArray = computed((): ProcessOption => {
    if (process?.value) {
      if (typeof process.value === 'function') {
        return process.value(dotsPos.value)
      } else if (dotsPos.value.length === 1) {
        return [[0, dotsPos.value[0]]]
      } else if (dotsPos.value.length > 1) {
        return [[Math.min(...dotsPos.value), Math.max(...dotsPos.value)]]
      }
    }
    return []
  })

  const markList = computed(() => {
    if (!marks?.value) {
      return []
    }

    const getMarkByValue = (value: Value, mark?: MarkOption): Mark => {
      const pos = parseValue(value)
      return {
        pos,
        value,
        label: value,
        active: isActiveByPos(pos),
        ...mark,
      }
    }

    if (marks.value === true) {
      return getValues().map((value) => getMarkByValue(value))
    } else if (Object.prototype.toString.call(marks.value) === '[object Object]') {
      return Object.keys(marks.value)
        .sort((a, b) => +a - +b)
        .map((value) => {
          const item = (marks.value as Marks)[value]
          return getMarkByValue(value, typeof item !== 'string' ? item : { label: item })
        })
    } else if (Array.isArray(marks.value)) {
      return marks.value.map((value) => getMarkByValue(value))
    } else if (typeof marks.value === 'function') {
      return getValues()
        .map((value) => ({ value, result: (marks.value as MarksFunction)(value) }))
        .filter(({ result }) => !!result)
        .map(({ value, result }) => getMarkByValue(value, result as Mark))
    } else {
      return []
    }
  })

  const getRecentDot = (pos: number) => {
    const arr = dotsPos.value.map((dotPos) => Math.abs(dotPos - pos))
    return arr.indexOf(Math.min(...arr))
  }

  const getIndexByValue = (value: Value) => {
    if (data.value) {
      return data.value.indexOf(value)
    }
    return new Decimal(+value).minus(min.value).divide(interval.value).toNumber()
  }

  const getRangeDir = (range: number) =>
    range
      ? new Decimal(range)
          .divide(
            new Decimal(data.value ? data.value.length - 1 : max.value)
              .minus(data.value ? 0 : min.value)
              .toNumber(),
          )
          .multiply(100)
          .toNumber()
      : 100

  const maxRangeDir = computed(() => getRangeDir(maxRange.value))
  const minRangeDir = computed(() => getRangeDir(minRange.value))
  const getDotRange = (index: number, key: 'min' | 'max', defaultValue: number) => {
    if (dotOptions?.value) {
      return defaultValue
    }
    const option = Array.isArray(dotOptions?.value) ? dotOptions?.value[index] : dotOptions?.value
    return option && option[key] !== void 0 ? parseValue(option[key] as Value) : defaultValue
  }

  const valuePosRange = computed(() => {
    const valuePosRange: Array<[number, number]> = []
    dotsPos.value.forEach((pos, i) => {
      valuePosRange.push([
        Math.max(
          minRange.value ? minRangeDir.value * i : 0,
          !enableCross.value ? dotsPos.value[i - 1] || 0 : 0,
          getDotRange(i, 'min', 0),
        ),
        Math.min(
          minRange.value ? 100 - minRangeDir.value * (dotsPos.value.length - 1 - i) : 100,
          !enableCross.value ? dotsPos.value[i + 1] || 100 : 100,
          getDotRange(i, 'max', 100),
        ),
      ])
    })
    return valuePosRange
  })

  const getValidPos = (pos: number, index: number) => {
    const range = valuePosRange.value[index]
    let inRange = true
    if (pos < range[0]) {
      pos = range[0]
      inRange = false
    } else if (pos > range[1]) {
      pos = range[1]
      inRange = false
    }
    return {
      pos,
      inRange,
    }
  }

  const setDotPos = (pos: number, index: number) => {
    pos = getValidPos(pos, index).pos
    const changePos = pos - dotsPos.value[index]

    if (!changePos) {
      return
    }

    let changePosArr: DotsPosChangeArray = new Array(dotsPos.value.length)
    if (fixed.value) {
      changePosArr = getFixedChangePosArr(changePos, index)
    } else if (minRange.value || maxRange.value) {
      changePosArr = getLimitRangeChangePosArr(pos, changePos, index)
    } else {
      changePosArr[index] = changePos
    }

    setDotsPos(dotsPos.value.map((curPos, i) => curPos + (changePosArr[i] || 0)))
  }

  const getFixedChangePosArr = (changePos: number, index: number): DotsPosChangeArray => {
    dotsPos.value.forEach((originPos, i) => {
      if (i !== index) {
        const { pos: lastPos, inRange } = getValidPos(originPos + changePos, i)
        if (!inRange) {
          changePos =
            Math.min(Math.abs(lastPos - originPos), Math.abs(changePos)) * (changePos < 0 ? -1 : 1)
        }
      }
    })
    return dotsPos.value.map(() => changePos)
  }

  const isPos = (pos: any): pos is number => {
    return typeof pos === 'number'
  }

  const getLimitRangeChangePosArr = (
    pos: number,
    changePos: number,
    index: number,
  ): DotsPosChangeArray => {
    const changeDots = [{ index, changePos }]
    const newChangePos = changePos
    ;[minRange.value, maxRange.value].forEach((isLimitRange?: number, rangeIndex?: number) => {
      if (!isLimitRange) {
        return false
      }
      const isMinRange = rangeIndex === 0
      const isForward = changePos > 0
      let next = 0
      if (isMinRange) {
        next = isForward ? 1 : -1
      } else {
        next = isForward ? -1 : 1
      }

      // Determine if the two positions are within the legal interval
      const inLimitRange = (pos2: number, pos1: number): boolean => {
        const diff = Math.abs(pos2 - pos1)
        return isMinRange ? diff < minRangeDir.value : diff > maxRangeDir.value
      }

      let i = index + next
      let nextPos = dotsPos.value[i]
      let curPos = pos
      while (isPos(nextPos) && inLimitRange(nextPos, curPos)) {
        const { pos: lastPos } = getValidPos(nextPos + newChangePos, i)
        changeDots.push({
          index: i,
          changePos: lastPos - nextPos,
        })
        i = i + next
        curPos = lastPos
        nextPos = dotsPos.value[i]
      }
    })
    return dotsPos.value.map((_, i) => {
      const changeDot = changeDots.filter((dot) => dot.index === i)
      return changeDot.length ? changeDot[0].changePos : 0
    })
  }

  const dotsIndex = computed(() => dotsValue.value.map((val) => getIndexByValue(val)))

  return {
    dotsIndex,
    setDotPos,
    dotsValue,
    parseValue,
    parsePos,
    setValue,
    dotsPos,
    getRecentDot,
    getIndexByValue,
    getValueByIndex,
    isActiveByPos,
  }
}
