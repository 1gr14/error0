import { Error0 } from '../index.js'

export const tagsPlugin = <TTag extends string>({
  transport = 'private',
  tags,
  strict = true,
}: { transport?: 'public' | 'private' | 'none'; tags?: TTag[] | readonly TTag[]; strict?: boolean } = {}) => {
  // function hasTag(error: Error0, tag: TTag): boolean
  // function hasTag(error: Error0, tag: TTag[], policy: 'every' | 'some'): boolean
  // function hasTag(error: Error0, tag: TTag | TTag[], policy?: 'every' | 'some'): boolean {
  //   const tags = (error as any).tags as string[] | undefined
  //   if (!tags) {
  //     return false
  //   }
  //   if (Array.isArray(tag)) {
  //     if (policy === 'every') {
  //       return tag.every((item) => tags.includes(item))
  //     }
  //     return tag.some((item) => tags.includes(item))
  //   }
  //   return tags.includes(tag)
  // }
  const isTag = (value: unknown): value is TTag =>
    typeof value === 'string' && (!tags || !strict || tags.includes(value as TTag))
  return Error0.plugin()
    .prop('tags', {
      init: (input: string[]) => input,
      resolve: ({ flow }) => {
        const merged: string[] = []
        for (const value of flow) {
          if (Array.isArray(value)) {
            merged.push(...value)
          }
        }
        return merged.length > 0 ? Array.from(new Set(merged)) : undefined
      },
      serialize: ({ resolved, isPublic }) => {
        if (transport === 'none' || (transport === 'private' && isPublic)) {
          return undefined
        }
        return resolved
      },
      deserialize: ({ value }) => {
        if (!Array.isArray(value)) {
          return undefined
        }
        return value.filter((item) => isTag(item))
      },
    })
    .method('hasTag', (error, tag: TTag | TTag[], policy: 'every' | 'some' = 'every'): boolean => {
      const tags = error.tags
      if (!tags) {
        return false
      }
      if (Array.isArray(tag)) {
        if (policy === 'every') {
          return tag.every((item) => tags.includes(item))
        }
        return tag.some((item) => tags.includes(item))
      }
      return tags.includes(tag)
    })
}
