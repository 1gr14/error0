import { describe, expect, it } from 'bun:test'
import { Error0 } from '../index.js'
import { causePlugin } from './cause.js'

describe('causePlugin', () => {
  const statusPlugin = Error0.plugin().use('prop', 'status', {
    init: (input: number) => input,
    resolve: ({ flow }) => flow.find((value) => typeof value === 'number'),
    serialize: ({ resolved }) => resolved,
    deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
  })

  const codes = ['NOT_FOUND', 'BAD_REQUEST', 'UNAUTHORIZED'] as const
  type Code = (typeof codes)[number]
  const codePlugin = Error0.plugin().use('prop', 'code', {
    init: (input: Code) => input,
    resolve: ({ flow }) => flow.find((value) => typeof value === 'string' && codes.includes(value)),
    serialize: ({ resolved, isPublic }) => (isPublic ? undefined : resolved),
    deserialize: ({ value }) =>
      typeof value === 'string' && codes.includes(value as Code) ? (value as Code) : undefined,
  })

  it('serializes and deserializes nested Error0 causes', () => {
    const AppError = Error0.use(statusPlugin)
      .use(codePlugin)
      .use(causePlugin({ transport: 'public' }))
    const deepCauseError = new AppError('deep cause')
    const causeError = new AppError('cause', { status: 409, code: 'NOT_FOUND', cause: deepCauseError })
    const error = new AppError('root', { status: 500, cause: causeError })

    const json = AppError.serialize(error, false)
    expect(typeof json.cause).toBe('object')
    expect((json.cause as any).message).toBe('cause')
    expect((json.cause as any).status).toBe(409)
    expect((json.cause as any).code).toBe('NOT_FOUND')
    expect((json.cause as any).cause).toBeDefined()
    expect((json.cause as any).cause.message).toBe('deep cause')
    expect((json.cause as any).cause.status).toBe(undefined)
    expect((json.cause as any).cause.code).toBe(undefined)
    expect((json.cause as any).cause.cause).toBeUndefined()

    const recreated = AppError.from(json)
    expect(recreated).toBeInstanceOf(AppError)
    expect(recreated.cause).toBeInstanceOf(AppError)
    expect((recreated.cause as any).status).toBe(409)
    expect((recreated.cause as any).code).toBe('NOT_FOUND')
    expect((recreated.cause as any).cause).toBeInstanceOf(AppError)
    expect((recreated.cause as any).cause.message).toBe('deep cause')
    expect((recreated.cause as any).cause.status).toBe(undefined)
    expect((recreated.cause as any).cause.code).toBe(undefined)
    expect((recreated.cause as any).cause.cause).toBeUndefined()
  })

  it('supports variants', () => {
    class DbError extends Error {
      query: string
      constructor(message: string, options: { cause?: unknown; query: string }) {
        super(message, { cause: options.cause })
        this.query = options.query
        this.name = 'DbError'
      }
      static serialize(error: DbError): Record<string, unknown> {
        return {
          message: error.message,
          query: error.query,
        }
      }
      static from(error: unknown): DbError {
        if (error instanceof DbError) {
          return error
        }
        const object = typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : {}
        const message =
          typeof object.message === 'string' ? object.message : typeof error === 'string' ? error : 'Unknown error'
        const query = typeof object.query === 'string' ? object.query : 'NOT_FOUND'
        return new DbError(message, { cause: error, query })
      }
      static isSerialized(serializedCause: unknown): boolean {
        return (
          typeof serializedCause === 'object' &&
          serializedCause !== null &&
          'query' in serializedCause &&
          typeof serializedCause.query === 'string'
        )
      }
    }
    const AppError = Error0.use(statusPlugin)
      .use(codePlugin)
      .use(
        causePlugin({
          variants: {
            DbError,
          },
        }),
      )
    const dbError = new DbError('test', { query: 'SELECT * FROM users' })
    const error = new AppError('root', { status: 500, cause: dbError })
    const json = AppError.serialize(error, false)
    expect(json.cause).toBeDefined()
    expect((json.cause as any).query).toBe('SELECT * FROM users')
    const recreated = AppError.from(json)
    expect(recreated).toBeInstanceOf(AppError)
    expect(recreated.cause).toBeInstanceOf(DbError)
    expect((recreated.cause as any).query).toBe('SELECT * FROM users')
  })
})
