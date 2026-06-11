import { describe, expect, expectTypeOf, it } from 'bun:test'
import { Error0 } from '../index.js'
import { codeStatusPlugin } from './code-status.js'

describe('codeStatusPlugin', () => {
  const codes = {
    BAD_REQUEST: 400,
    UNPROCESSABLE: 422,
    INTERNAL: true,
  } as const

  it('declares both props and sets status from the code via adapt', () => {
    const AppError = Error0.use(codeStatusPlugin({ codes }))
    const error = new AppError('test', { code: 'UNPROCESSABLE' })

    expectTypeOf<typeof error.code>().toEqualTypeOf<'BAD_REQUEST' | 'UNPROCESSABLE' | 'INTERNAL' | undefined>()
    expectTypeOf<typeof error.status>().toEqualTypeOf<number | undefined>()
    expect(error.code).toBe('UNPROCESSABLE')
    expect(error.status).toBe(422)
  })

  it('keeps status undefined when the code has no status', () => {
    const AppError = Error0.use(codeStatusPlugin({ codes }))
    const error = new AppError('test', { code: 'INTERNAL' })
    expect(error.code).toBe('INTERNAL')
    expect(error.status).toBeUndefined()
  })

  it('does not override an explicitly provided status', () => {
    const AppError = Error0.use(codeStatusPlugin({ codes }))
    const error = new AppError('test', { code: 'BAD_REQUEST', status: 418 })
    expect(error.status).toBe(418)
  })

  it('accepts a status without a code', () => {
    const AppError = Error0.use(codeStatusPlugin({ codes }))
    const error = new AppError('test', { status: 500 })
    expect(error.code).toBeUndefined()
    expect(error.status).toBe(500)
  })

  it('serializes and deserializes both props', () => {
    const AppError = Error0.use(codeStatusPlugin({ codes }))
    const error = new AppError('test', { code: 'BAD_REQUEST' })

    const json = AppError.serialize(error, false)
    expect(json.code).toBe('BAD_REQUEST')
    expect(json.status).toBe(400)

    const recreated = AppError.from(json)
    expect(recreated.code).toBe('BAD_REQUEST')
    expect(recreated.status).toBe(400)
  })

  it('ignores code values outside the map on deserialize', () => {
    const AppError = Error0.use(codeStatusPlugin({ codes }))
    const recreated = AppError.from({ message: 'test', code: 'SOMETHING_ELSE', status: 400 })
    expect(recreated.code).toBeUndefined()
    expect(recreated.status).toBe(400)
  })

  it('resolves code and status from the cause flow', () => {
    const AppError = Error0.use(codeStatusPlugin({ codes }))
    const inner = new AppError('inner', { code: 'BAD_REQUEST' })
    const outer = new AppError('outer', { cause: inner })
    expect(outer.code).toBe('BAD_REQUEST')
    expect(outer.status).toBe(400)
  })

  it('hides both props in public serialization by default', () => {
    const AppError = Error0.use(codeStatusPlugin({ codes }))
    const error = new AppError('test', { code: 'BAD_REQUEST' })
    const json = AppError.serialize(error)
    expect(json.code).toBeUndefined()
    expect(json.status).toBeUndefined()
  })

  it("keeps both props in public serialization when transport is 'public'", () => {
    const AppError = Error0.use(codeStatusPlugin({ codes, transport: 'public' }))
    const error = new AppError('test', { code: 'BAD_REQUEST' })
    const json = AppError.serialize(error)
    expect(json.code).toBe('BAD_REQUEST')
    expect(json.status).toBe(400)
  })

  it('allows any string code when codes map is not provided', () => {
    const AppError = Error0.use(codeStatusPlugin())
    const error = new AppError('test', { code: 'ANYTHING' })
    expect(error.code).toBe('ANYTHING')
    expect(error.status).toBeUndefined()
  })

  it('not allowed incorrect code name', () => {
    const AppError = Error0.use(codeStatusPlugin({ codes }))
    // @ts-expect-error - incorrect code name
    const error = new AppError('test', { code: 'SOMETHING_ELSE' })
    expect(error.status).toBeUndefined()
  })
})
