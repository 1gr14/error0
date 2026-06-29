import { RedirectTask } from '@point0/core/navigation'
import type { AdapterNavigateOptions, RedirectTaskSerialized } from '@point0/core/navigation'
import { Error0 } from '../index.js'

export const redirectPlugin = <TAdapterNavigateOptions extends AdapterNavigateOptions = AdapterNavigateOptions>() => {
  return Error0.plugin()
    .prop('redirect', {
      init: (redirect: RedirectTaskSerialized<TAdapterNavigateOptions> | RedirectTask<TAdapterNavigateOptions>) =>
        RedirectTask.from(redirect),
      resolve: ({ flow }) => flow.find(Boolean),
      serialize: ({ resolved }) => resolved?.serialize(),
      deserialize: ({ value }) => {
        try {
          return RedirectTask.from(value as never)
        } catch {
          return undefined
        }
      },
    })
    .adapt((error) => {
      const cause = error.cause
      if (RedirectTask.is(cause)) {
        error.redirect = cause
        error.message = `Redirect to ${cause.to}`
        delete error.cause
      }
    })
}
