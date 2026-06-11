import { describe, expect, it } from 'bun:test'
import { Error0 } from '../index.js'
import { stackPlugin } from './stack.js'

describe('stackPlugin', () => {
  it('default (private): stack only in serializePrivate — same as the core default', () => {
    const AppError = Error0.use(stackPlugin())
    const error = new AppError('boom')
    expect(error.serializePublic().stack).toBeUndefined()
    expect(typeof error.serializePrivate().stack).toBe('string')
  })

  it("transport: 'public' sends the stack to both outputs", () => {
    const AppError = Error0.use(stackPlugin({ transport: 'public' }))
    const error = new AppError('boom')
    expect(typeof error.serializePublic().stack).toBe('string')
    expect(typeof error.serializePrivate().stack).toBe('string')
  })

  it("transport: 'none' drops the stack from both outputs; the runtime value stays", () => {
    const AppError = Error0.use(stackPlugin({ transport: 'none' }))
    const error = new AppError('boom')
    expect(error.serializePublic().stack).toBeUndefined()
    expect(error.serializePrivate().stack).toBeUndefined()
    expect(typeof error.stack).toBe('string')
  })

  it('round-trip keeps the stack via the private output', () => {
    const AppError = Error0.use(stackPlugin())
    const error = new AppError('boom')
    const recreated = AppError.from(error.serializePrivate())
    expect(recreated.stack).toBe(error.stack as string)
  })
})
