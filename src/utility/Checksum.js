// CRC table for checksum (cached)
let crcTable = null

/**
 * Generate the CRC table for checksums. This is a fairly complex
 * operation that should only be executed once and cached for
 * repeat use.
 */
const makeCRCTable = function () {
  if (crcTable !== null) {
    return crcTable
  }

  let c
  crcTable = []

  for (let n = 0; n < 256; n++) {
    c = n

    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1))
    }

    crcTable[n] = c
  }

  return crcTable
}

/**
 * @namespace NGN.UTILITY
 */
/**
 * @method checksum
 * Create the checksum of the specified string.
 * The checksum is calculated using [CRC](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) (cyclic redundancy check).
 * It can be used to identify data corruption, though it is a computationally expensive operation.
 * When used in moderation, performance impact is negligible, but extended use may impact performance.
 * @param  {string} content
 * The content to generate a checksum for.
 * @return {string}
 * Generates a checksum value.
 */
const checksum = str => {
  if (typeof str === 'object') {
    str = JSON.stringify(str)
  }

  if (!crcTable) {
    crcTable = makeCRCTable()
  }

  let crc = 0 ^ (-1)

  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF]
  }

  return ((crc ^ (-1)) >>> 0).toString()
}

export { checksum as default, makeCRCTable }
