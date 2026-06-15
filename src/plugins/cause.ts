import { Error0 } from '../index.js'

type Transport = 'public' | 'private' | 'none'

// Carry the `.cause` chain across serialize/deserialize: nested Error0s are rebuilt by `from()`,
// foreign errors are kept structurally as { name, message, stack } and their own chain is walked
// (cycle + depth guarded). `transport` gates who sees the cause: 'private' (default) keeps it out
// of serializePublic(), 'public' sends it to everyone, 'none' drops it from every output.
export const causePlugin = ({ transport = 'private' }: { transport?: Transport } = {}) =>
  Error0.plugin().cause({
    serialize: ({ cause, isPublic, is, serialize }) => {
      if (transport === 'none' || (transport === 'private' && isPublic)) {
        return undefined
      }
      const seen = new Set<unknown>()
      const serializeChain = (value: unknown, depth: number): unknown => {
        if (value === undefined || value === null || depth > Error0.MAX_CAUSES_DEPTH || seen.has(value)) {
          return undefined
        }
        seen.add(value)
        if (is(value)) {
          return serialize(value)
        }
        // A foreign Error (e.g. a ZodError) must not vanish from the private output — keep its
        // identity and stack verbatim and walk its own cause chain.
        if (value instanceof Error) {
          const record: Record<string, unknown> = { name: value.name, message: value.message }
          if (value.stack) {
            record.stack = value.stack
          }
          const nested = serializeChain((value as { cause?: unknown }).cause, depth + 1)
          if (nested !== undefined) {
            record.cause = nested
          }
          return record
        }
        return undefined
      }
      return serializeChain(cause, 0)
    },
    deserialize: ({ cause, fromSerialized, isSerialized }) => {
      if (isSerialized(cause)) {
        return fromSerialized(cause)
      }
      return cause
    },
  })
