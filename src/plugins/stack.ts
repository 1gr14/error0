import { Error0 } from '../index.js'

// The plain stack plugin: the core default gate (stack is private), spelled as a plugin so an
// app's error class reads as a uniform plugin list — and so the policy is switchable:
// transport: 'public' sends the stack to clients too, 'none' keeps it out of every output.
export const stackPlugin = ({ transport = 'private' }: { transport?: 'public' | 'private' | 'none' } = {}) =>
  Error0.plugin().stack({
    serialize: ({ value, isPublic }) => {
      if (transport === 'none' || (transport === 'private' && isPublic)) {
        return undefined
      }
      return value
    },
  })
