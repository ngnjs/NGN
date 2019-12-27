/* node-only */
import GUID from './GUID.js'
/* end-node-only */

/**
 * @namespace NGN.UTILITY
 */
/**
 * @method UUID
 * Generate a universally unique identifier (v4).
 *
 * This is a "fast" UUID generator, designed to work in the browser.
 * This will generate a UUID in less than 20ms on Chrome, as of Nov 6, 2017.
 * Code courtesy of @broofa on StackOverflow. A proposal
 * has been made to TC39 to include a UUID generator in ECMAScript (Late 2019).
 * If/when that happens, this method will use any native functionality.
 * Until this, this method will use a simplified implementation.
 *
 * While this method cannot absolutely guarantee there will be no collisions
 * (duplicates), the chances are 1:5.3x10^^36 (1 in over 100 quadrillion).
 * You are over 30 _octillion_ times more likely to win the Powerball than to
 * generate two identical "random" UUIDs using the version 4 scheme.
 * @return {string}
 * Returns a [V4 GUID](https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_.28random.29).
 */
const UUID = () => {
  /* node-only */
  return GUID()
  /* end-node-only */
  /* browser-only */
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => // eslint-disable-line
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16) // eslint-disable-line
  )
  /* end-browser-only */
}

export { UUID as default }
