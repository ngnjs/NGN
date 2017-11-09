// [PARTIAL]
{
  // CRC table for checksum (cached)
  crcTable: NGN.private(null),

  /**
   * @method makeCRCTable
   * Generate the CRC table for checksums. This is a fairly complex
   * operation that should only be executed once and cached for
   * repeat use.
   * @private
   */
  makeCRCTable: NGN.privateconst(function () {
    let c
    let crcTable = []

    for (let n = 0; n < 256; n++) {
      c = n

      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1))
      }

      crcTable[n] = c
    }

    return crcTable
  }),

  /**
   * @method checksum
   * Create the checksum of the specified string.
   * @param  {string} content
   * The content to generate a checksum for.
   * @return {string}
   * Generates a checksum value.
   */
  checksum: NGN.const(function (str) {
    if (!this.crcTable) {
      this.crcTable = this.makeCRCTable()
    }

    let crc = 0 ^ (-1)

    for (let i = 0; i < str.length; i++) {
      crc = (crc >>> 8) ^ this.crcTable[(crc ^ str.charCodeAt(i)) & 0xFF]
    }

    return (crc ^ (-1)) >>> 0
  }),

  /**
   * @method UUID
   * Generate a universally unique identifier (v4).
   *
   * This is a "fast" UUID generator, designed to work in the browser.
   * This will generate a UUID in less than 20ms on Chrome, as of Nov 6, 2017.
   * Code courtesy of @broofa on StackOverflow.
   *
   * While this method cannot absolutely guarantee there will be no collisions
   * (duplicates), the chances are 1:5.3x10^^36 (1 in over 100 quadrillion).
   * You are over 30 _octillion_ times more likely to win the Powerball than to
   * generate two identical "random" UUIDs using the version 4 scheme.
   * @return {string}
   * Returns a [V4 GUID](https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_.28random.29).
   */
  UUID: NGN.const(function () {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  })

  /**
   * @method GUID
   * Generate a globally unique identifier. A GUID is the Microsoft
   * implementation of a UUIDv4.
   *
   * The likelihood of an ID collision, according to the original author (Jeff
   * Ward) is 1:3.26x10^15 (1 in 3.26 quadrillion). Results are generated between
   * approximately 105ms (Desktop) and 726ms (Android) as of May 2016.
   * @return {[type]} [description]
   */
  GUID: NGN.const(function () {
    let lut = []

    for (let i = 0; i < 256; i++) {
      lut[i] = (i < 16 ? '0' : '') + (i).toString(16)
    }

    const d0 = Math.random() * 0xffffffff | 0
    const d1 = Math.random() * 0xffffffff | 0
    const d2 = Math.random() * 0xffffffff | 0
    const d3 = Math.random() * 0xffffffff | 0

    return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] +
      '-' + lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] +
      lut[d1 >> 24 & 0xff] + '-' + lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' +
      lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] + lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] +
      lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff]
  })

  // /**
  //  * @method objectByteSize
  //  * Calculates the _estimated_ size (in bytes) of primitive key/value objects,
  //  * meaning those that do not contain functions, accessors (getters/setters),
  //  * or other attributes other than `String`, `Number`, or `Boolean` values.
  //  * NGN treats dates as `String` values.
  //  *
  //  * JavaScript engines differ in how they manage memory, but most do not
  //  * calculate the size of functions. If a value of type `function` is found in
  //  * the object, NGN will calculate the size of it's `String` representation.
  //  * This is a weak measure of function size since most JavaScript engines
  //  * do not expose enough realtime heap data to know calculate with accuracy at
  //  * any given point in time.
  //  *
  //  * This method attempts to implement similar principles to C's `sizeOf` method.
  //  *
  //  * Consider this method to provide a **best guess based on the data we have
  //  * available**.
  //  *
  //  * @param {Object} object
  //  * The primitive key/value object upon which the bytesize estimation will be made.
  //  * @param {Boolean} [ignoreFunctionEstimate=false]
  //  * By default, NGN will calculate the `String` representation of any functions
  //  * it encounters in the key/value object. Setting this to `true` will prevent
  //  * this behavior, effectively using a `0` to calculate function size.
  //  */
  // objectByteSize: NGN.const(function (obj, ignore=false) {
  //   switch (typeof obj) {
  //     case 'string':
  //       return obj.length * 2
  //
  //     case 'boolean':
  //       return 4
  //
  //     case 'number':
  //       return 8
  //
  //     case 'function':
  //       if (!ignore) {
  //         return obj.toString().length * 2
  //       }
  //
  //       return 0
  //   }
  //
  //   let list = []
  //   let stack = [obj]
  //   let bytes = 0
  //
  //   while (stack.length) {
  //     let value = stack.pop()
  //
  //     if (typeof value === 'object') {
  //       if (list.indexOf(value) < 0) {
  //         list.push(value)
  //
  //         // If the object is not an array, add key sizes
  //         const isArray = !Array.isArray(value)
  //
  //         for (let key in value) {
  //           if (!isArray) {
  //             bytes += (2 * key.length) + NGN.DATA.util(value[key])
  //             stack.push(value[key])
  //           } else {
  //
  //           }
  //         }
  //       }
  //     } else {
  //       bytes += NGN.DATA.util.objectByteSize(value)
  //     }
  //   }
  //
  //   return bytes
  // })
})
