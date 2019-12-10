/**
 * @namespace NGN.UTILITY
 */
/**
 * @method GUID
 * Generate a globally unique identifier. A GUID is the Microsoft
 * implementation of a UUIDv4.
 *
 * The likelihood of an ID collision, according to the original author (Jeff
 * Ward) is 1:3.26x10^15 (1 in 3.26 quadrillion). Results are generated between
 * approximately 105ms (Desktop) and 726ms (Android) as of May 2016.
 * @return {string} [description]
 */
const GUID = () => {
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
}

export { GUID as default }