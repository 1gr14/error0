import { describe, expect, it } from 'bun:test'
import { Error0 } from '../index.js'
import { expectedPlugin } from './expected.js'

describe('expectedPlugin', () => {
  const statusPlugin = Error0.plugin().use('prop', 'status', {
    init: (input: number) => input,
    resolve: ({ flow }) => flow.find((value) => typeof value === 'number'),
    serialize: ({ resolved }) => resolved,
    deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
  })

  it('can be used to control error tracker behavior', () => {
    const AppError = Error0.use(statusPlugin).use(expectedPlugin())
    const errorExpected = new AppError('test', { status: 400, expected: true })
    const errorUnexpected = new AppError('test', { status: 400, expected: false })
    const usualError = new Error('test')
    const errorFromUsualError = AppError.from(usualError)
    const errorWithExpectedErrorAsCause = new AppError('test', { status: 400, cause: errorExpected })
    const errorWithUnexpectedErrorAsCause = new AppError('test', { status: 400, cause: errorUnexpected })
    expect(errorExpected.expected).toBe(true)
    expect(errorUnexpected.expected).toBe(false)
    expect(AppError.isExpected(usualError)).toBe(false)
    expect(errorFromUsualError.expected).toBe(false)
    expect(errorFromUsualError.isExpected()).toBe(false)
    expect(errorWithExpectedErrorAsCause.expected).toBe(true)
    expect(errorWithExpectedErrorAsCause.isExpected()).toBe(true)
    expect(errorWithUnexpectedErrorAsCause.expected).toBe(false)
    expect(errorWithUnexpectedErrorAsCause.isExpected()).toBe(false)
  })

  it('resolves to false when any cause has false', () => {
    const AppError = Error0.use(expectedPlugin())
    const root = new AppError('root', { expected: true })
    const middle = new AppError('middle', { expected: false, cause: root })
    const leaf = new AppError('leaf', { expected: false, cause: middle })
    expect(leaf.expected).toBe(false)
    expect(leaf.isExpected()).toBe(false)
  })

  it('treats undefined expected as unexpected', () => {
    const AppError = Error0.use(expectedPlugin())
    const error = new AppError('without expected')
    expect(error.expected).toBe(false)
    expect(error.isExpected()).toBe(false)
  })

  it('supports override', () => {
    const AppError = Error0.use(statusPlugin).use(
      expectedPlugin({
        override: (error) => {
          return error.message.includes('CRITICAL') ? false : undefined
        },
      }),
    )
    const errorNonCritical = new AppError('USUAL: test', { status: 400 })
    const errorNonCriticalExpected = new AppError('USUAL: test', { status: 400, expected: true })
    const errorCritical = new AppError('CRITICAL: test', { status: 400 })
    const errorCriticalExpected = new AppError('CRITICAL: test', { status: 400, expected: true })
    expect(errorNonCritical.expected).toBe(false) // becouse expected was not provided at all
    expect(errorNonCriticalExpected.expected).toBe(true)
    expect(errorCritical.expected).toBe(false)
    expect(errorCriticalExpected.expected).toBe(false)
  })
})
