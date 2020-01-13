import crypto from 'crypto'

const algorithms = new Set(['sha256', 'sha384', 'sha512'])

/**
 * @class NGN.NET.SRI
 * This class is used to validate [subresource identities](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) in Node-like environments.
 * This is unnecessary in browsers, which support this functionality natively.
 * @singleton
 * @private
 */
export default class SRI {
  /**
   *
   * @param {string} integrityHash
   * The integrity string to verify.
   * @param {string} content
   * The content to check.
   * @param {string} [encoding=utf-8]
   * The content encoding.
   * @returns {object}
   * Returns an object with 2 keys: `valid` (boolean) and `reason` (string). Example:
   * ```
   * {
   *   valid: true,
   *   reason: 'Integrity match.'
   * }
   * ```
   */
  static verify (integrityHash, content, encoding = 'utf8') {
    const integrity = /^(sha[0-9]{3})-(.*)/i.exec(integrityHash)

    if (!integrity) {
      return {
        valid: false,
        reason: `"${integrityHash}" is invalid (improper format, expected {sha###}-{hash} format).`
      }
    }

    const algorithm = integrity[1].toLowerCase()
    const hash = integrity[2]

    try {
      const checksum = SRI.checksum(algorithm, content, encoding)

      if (checksum !== hash) {
        return {
          valid: false,
          reason: 'Integrity mismatch.'
        }
      }
    } catch (e) {
      return {
        valid: false,
        reason: e.message
      }
    }

    return {
      valid: true,
      reason: 'Integrity match.'
    }
  }

  static checksum (algorithm, content, encoding = 'utf8') {
    algorithm = algorithm.toLowerCase()

    if (!algorithms.has(algorithm)) {
      throw new Error(`Invalid algorithm (${algorithm}). Expected one of: ${Array.from(algorithms).join(', ')}`)
    }

    return crypto.createHash(algorithm)
      .update(content, encoding)
      .digest('base64')
  }

  static generate (content, algorithm = 'sha512', encoding = 'utf8') {
    algorithm = algorithm.trim().toLowerCase()

    if (!algorithms.has(algorithm)) {
      throw new Error(`Invalid algorithm: ${algorithm}. Must be one of: ${Array.from(algorithms).join(', ')}`)
    }

    return `${algorithm}-${SRI.checksum(algorithm, content, encoding)}`
  }
}
