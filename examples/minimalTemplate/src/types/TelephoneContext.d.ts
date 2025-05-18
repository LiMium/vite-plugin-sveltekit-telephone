import type { Cookies } from '@sveltejs/kit'
 
declare module 'telephone' {
  namespace Telephone {
    interface Context {
      cookies: Cookies
    }
  }
}
