import { describe, expect, it } from 'bun:test'
import { Error0 } from '../index.js'
import { causeVariantsPlugin } from './cause-variants.js'

const statusPlugin = Error0.plugin().use('prop', 'status', {
  init: (input: number) => input,
  resolve: ({ flow }) => flow.find((value) => typeof value === 'number'),
  serialize: ({ resolved }) => resolved,
  deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
})

describe('causeVariantsPlugin', () => {
  it('round-trips a registered foreign error type via variants', () => {
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
    const AppError = Error0.use(statusPlugin).use(
      causeVariantsPlugin({
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
