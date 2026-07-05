import { describe, expect, expectTypeOf, it } from 'bun:test'
import { Error0 } from '../index.js'
import { levelPlugin } from './level.js'

describe('levelPlugin', () => {
  // Ordered most-dangerous first — that order defines the severity scale.
  const levels = ['fatal', 'error', 'warn', 'info'] as const

  it('serializes and deserializes an allowed level', () => {
    const AppError = Error0.use(levelPlugin({ levels: [...levels] }))
    const error = new AppError('test', { level: 'warn' })

    expect(error.level).toBe('warn')
    expectTypeOf<typeof error.level>().toEqualTypeOf<'fatal' | 'error' | 'warn' | 'info' | undefined>()

    const json = AppError.serialize(error, false)
    expect(json.level).toBe('warn')

    const recreated = AppError.from(json)
    expect(recreated.level).toBe('warn')
  })

  it('is undefined when no level was set', () => {
    const AppError = Error0.use(levelPlugin({ levels: [...levels] }))
    const error = new AppError('test')
    expect(error.level).toBeUndefined()
  })

  it('ignores level values outside the allowed list on deserialize', () => {
    const AppError = Error0.use(levelPlugin({ levels: [...levels] }))
    const recreated = AppError.from({ message: 'test', level: 'SHOUT' })
    expect(recreated.level).toBeUndefined()
  })

  it('accepts any string when no levels are configured', () => {
    const AppError = Error0.use(levelPlugin())
    const recreated = AppError.from({ message: 'test', level: 'whatever' })
    expect(recreated.level).toBe('whatever')
  })

  it('resolves to the most dangerous level in the cause chain (severe cause is not masked by a mild wrapper)', () => {
    const AppError = Error0.use(levelPlugin({ levels: [...levels] }))
    const cause = new AppError('root', { level: 'error' })
    const wrapper = new AppError('wrap', { level: 'info', cause })
    expect(wrapper.level).toBe('error')
  })

  it('does not downgrade a severe wrapper because of a milder cause', () => {
    const AppError = Error0.use(levelPlugin({ levels: [...levels] }))
    const cause = new AppError('root', { level: 'info' })
    const wrapper = new AppError('wrap', { level: 'error', cause })
    expect(wrapper.level).toBe('error')
  })

  it('picks the most dangerous level anywhere in a deep chain', () => {
    const AppError = Error0.use(levelPlugin({ levels: [...levels] }))
    const root = new AppError('root', { level: 'warn' })
    const middle = new AppError('middle', { level: 'fatal', cause: root })
    const leaf = new AppError('leaf', { level: 'info', cause: middle })
    expect(leaf.level).toBe('fatal')
  })

  it("keeps the level off the public wire when transport is 'private' (default)", () => {
    const AppError = Error0.use(levelPlugin({ levels: [...levels] }))
    const error = new AppError('test', { level: 'warn' })
    expect(AppError.serialize(error, true).level).toBeUndefined()
    expect(AppError.serialize(error, false).level).toBe('warn')
  })

  it("sends the level on the public wire when transport is 'public'", () => {
    const AppError = Error0.use(levelPlugin({ levels: [...levels], transport: 'public' }))
    const error = new AppError('test', { level: 'warn' })
    expect(AppError.serialize(error, true).level).toBe('warn')
  })

  it("never serializes the level when transport is 'none'", () => {
    const AppError = Error0.use(levelPlugin({ levels: [...levels], transport: 'none' }))
    const error = new AppError('test', { level: 'warn' })
    expect(AppError.serialize(error, false).level).toBeUndefined()
    expect(AppError.serialize(error, true).level).toBeUndefined()
  })
})
