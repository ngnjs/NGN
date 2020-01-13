import NGN from '../../core.js'
import URL from '../URL.js'

const policies = new Set([
  'no-referrer',
  'no-referrer-when-downgrade',
  'same-origin',
  'origin',
  'strict-origin',
  'origin-when-cross-origin',
  'strict-origin-when-cross-origin',
  'unsafe-url',
  ''
])

export default class ReferrerPolicy {
  #policy = 'no-referrer-when-downgrade'

  constructor (policy = '') {
    policy = policy.trim().toLowerCase()

    this.policy = policy
  }

  get policy () {
    return NGN.coalesceb(this.#policy, 'no-referrer-when-downgrade')
  }

  set policy (policy) {
    if (!policies.has(policy)) {
      throw new Error(`"${policy}" is not a valid policy. Must be one of: ${Array.from(policies).join(', ')}`)
    }

    this.#policy = policy
  }

  stripReferrer (url = null, originonly = true) {
    // If url is null, return no referrer.
    if (url === null) {
      return null
    }
    // If url’s scheme is a local scheme, then return no referrer.
    if (url.local) {
      return null
    }
    
    return url.toString({
      username: false,
      password: false,
      path: !originonly,
      querystring: !originonly,
      encode: false
    })
  }

  referrerURL (from, to) {
    const Policy = this.policy
    
    if (Policy === 'no-referrer') {
      return null
    }
    
    from = typeof from === 'string' ? new URL(from) : from
    to = typeof to === 'string' ? new URL(to) : to
    
    switch (this.#policy) {
      case 'unsafe-url':
        return this.stripReferrer(from, false)
      
      case 'no-referrer-when-downgrade':
        if (from.protocol === 'https' && to.protocol !== 'https') {
          return null
        }

        return this.stripReferrer(from, false)

      case 'same-origin':
        if (from.isSameOrigin(to)) {
          return this.stripReferrer(from, false)
        }
        return null

      case 'origin':
        return from.formatString('{{protocol}}{{separator}}{{hostname}}{{port}}/')

      case 'strict-origin':
        if ('https' === to.protocol || !from.isSameOrigin(to)) {
          if (from.protocol !== to.protocol && !from.isSameOrigin(to)) {
            return null
          }

          return this.stripReferrer(from) + '/'
        }
        return null

      case 'origin-when-cross-origin':
        if (from.isSameOrigin(to, true)) {
          return this.stripReferrer(from, false)
        }
        return this.stripReferrer(from) + '/'

      case 'strict-origin-when-cross-origin':
        if (from.isSameOrigin(to)) {
          return this.stripReferrer(from, false)
        } else if (from.protocol === to.protocol) {
          return this.stripReferrer(from) + '/'
        }

        return null
    }

    return null
  }
}
