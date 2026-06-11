import { Error0 } from '../index.js'

const isExpected = ({
  flow,
  error,
  override,
}: {
  flow: unknown[]
  error: Error0
  override?: (error: any) => boolean | undefined
}) => {
  if (override) {
    const overridden = override(error)
    if (overridden !== undefined) {
      return overridden
    }
  }
  let expected = false
  for (const value of flow) {
    if (value === false) {
      return false
    }
    if (value === true) {
      expected = true
    }
  }
  return expected
}

export const expectedPlugin = <TError extends Error0>({
  transport = 'private',
  override,
}: { transport?: 'public' | 'private' | 'none'; override?: (error: TError) => boolean | undefined } = {}) =>
  Error0.plugin()
    .prop('expected', {
      init: (input: boolean) => input,
      resolve: ({ flow, error }) => isExpected({ flow, error, override }),
      serialize: ({ resolved, isPublic }) => {
        if (transport === 'none' || (transport === 'private' && isPublic)) {
          return undefined
        }
        return resolved
      },
      deserialize: ({ value }) => (typeof value === 'boolean' ? value : undefined),
    })
    .method('isExpected', (error) => {
      return isExpected({ flow: error.flow('expected'), error, override })
    })
