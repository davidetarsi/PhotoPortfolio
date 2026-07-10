const STATIC_PAGES = {
  '/contatti': '/contatti.html',
}

const ALBUM_SLUG_RE = /^\/[a-z0-9][a-z0-9-]*$/

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const pathname = url.pathname.replace(/\/$/, '') || '/'

    if (STATIC_PAGES[pathname]) {
      return env.ASSETS.fetch(new URL(STATIC_PAGES[pathname], url))
    }

    if (ALBUM_SLUG_RE.test(pathname)) {
      return env.ASSETS.fetch(new URL('/album.html', url))
    }

    return env.ASSETS.fetch(request)
  },
}
