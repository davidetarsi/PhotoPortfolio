import { handleDataRequest } from './worker/data-routes.js'
import { handleAdminRequest } from './worker/admin-routes.js'
import { handleContactRequest } from './worker/contact-routes.js'

const STATIC_PAGES = {
  '/contatti': '/contatti.html',
  '/admin': '/admin.html',
}

const ALBUM_SLUG_RE = /^\/[a-z0-9][a-z0-9-]*$/

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const pathname = url.pathname.replace(/\/$/, '') || '/'

    // API prima di tutto: non devono mai cadere nella regex degli album.
    if (pathname.startsWith('/api/data/')) {
      return handleDataRequest(request, env)
    }

    if (pathname.startsWith('/api/admin/')) {
      return handleAdminRequest(request, env)
    }

    if (pathname === '/api/contact') {
      return handleContactRequest(request, env)
    }

    if (STATIC_PAGES[pathname]) {
      return env.ASSETS.fetch(new URL(STATIC_PAGES[pathname], url))
    }

    if (ALBUM_SLUG_RE.test(pathname)) {
      return env.ASSETS.fetch(new URL('/album.html', url))
    }

    return env.ASSETS.fetch(request)
  },
}
