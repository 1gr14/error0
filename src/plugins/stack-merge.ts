import { Error0 } from '../index.js'

export const stackMergePlugin = ({
  transport = 'private',
  delimiter = '\n',
}: { transport?: 'public' | 'private' | 'none'; delimiter?: string } = {}) =>
  Error0.plugin().stack({
    serialize: ({ error, isPublic }) => {
      if (transport === 'none' || (transport === 'private' && isPublic)) {
        return undefined
      }
      return error
        .causes()
        .flatMap((cause) => {
          return cause instanceof Error && cause.stack && typeof cause.stack === 'string' ? cause.stack : []
        })
        .join(delimiter)
    },
  })
