import { Error0 } from '../index.js'

/**
 * A `preventRetry` flag — "and don't try this again": the marked error tells a retrying consumer (point0's queries and
 * its socket connect/join retries honor it) to sit out its automatic retries. The FIRST explicit boolean in the flow
 * chain wins — the error's own value first, then down the cause chain — so wrapping an inner `preventRetry: true` with
 * an outer `preventRetry: false` lifts the block.
 *
 * `transport` defaults to `'public'`, unlike the other field plugins: the flag exists for the CLIENT to act on, so it
 * must travel the wire — only a resolved `true` is serialized (`false` is the default behavior, nothing to send).
 */
export const preventRetryPlugin = ({ transport = 'public' }: { transport?: 'public' | 'private' | 'none' } = {}) =>
  Error0.plugin().prop('preventRetry', {
    init: (preventRetry: boolean) => preventRetry,
    resolve: ({ flow }) => flow.find((value) => typeof value === 'boolean'),
    serialize: ({ resolved, isPublic }) => {
      if (transport === 'none' || (transport === 'private' && isPublic)) {
        return undefined
      }
      return resolved === true ? true : undefined
    },
    deserialize: ({ value }) => (typeof value === 'boolean' ? value : undefined),
  })
