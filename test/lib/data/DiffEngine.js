// Addition: ['+', path, value]
// Deletion: ['-', path, oldValue]
// Modified: ['m', path, oldValue, newValue]
class ObjectDiff {
  static compare (lhs, rhs, path = []) {
    let differences = []
    let ltype = NGN.typeof(lhs)
    let rtype = NGN.typeof(rhs)

    // If the comparators aren't the same type, then
    // it is a replacement. This is identified as
    // removal of one object and creation of the other.
    if (ltype !== rtype) {
      return [
        ['m', path, lhs, rhs],
      ]
    }
console.log('Diffing:', ltype, lhs, rhs, 'PATH', path.join('.'))
    switch (ltype) {
      // case 'function':
      //   if (lhs.toString() !== rhs.toString()) {
      //     return ['m', path, lhs, rhs]
      //   }
      //
      //   return []

      case 'object':
        let keys = Object.keys(lhs)
        // let relativePath

        // Compare left to right for modifications and removals
        for (let i = 0; i < keys.length; i++) {
          // Reset the relative path
          let relativePath = Object.assign([], path)

          relativePath.push(keys[i])

          if (!rhs.hasOwnProperty(keys[i])) {
            // If no right hand argument exists, it was removed.
            differences.push(['-', relativePath, lhs[keys[i]]])
          } else if (NGN.typeof(lhs[keys[i]]) === 'object') {
            // Recursively compare objects
            differences = differences.concat(this.compare(lhs[keys[i]], rhs[keys[i]], relativePath))
          } else if (lhs[keys[i]] !== rhs[keys[i]]) {
            if (NGN.typeof(lhs[keys[i]]) === 'array' && NGN.typeof(rhs[keys[i]]) === 'array') {
              // If the keys contain arrays, re-run the comparison.
              differences = differences.concat(this.compare(lhs[keys[i]], rhs[keys[i]], relativePath))
            } else {
              // If the comparators exist but are different, a
              // modification ocurred.
              differences.push(['m', relativePath, lhs[keys[i]], rhs[keys[i]]])
            }
          }
        }

        // Compare right to left for additions
        keys = Object.keys(lhs)
        keys.unshift(rhs)
        keys = NGN.getObjectExtraneousPropertyNames.apply(this, keys)

        for (let i = 0; i < keys.length; i++) {
          // Reset the relative path
          let relativePath = Object.assign([], path)
          relativePath.push(keys[i])

          differences.push(['+', relativePath, rhs[keys[i]]])
        }

        break

      case 'array':
        differences = this.compareArray(lhs, rhs)

        break

      case 'string':
        console.log('TO DO: Add String Diff')

      default:
        if (lhs !== rhs) {
          if (NGN.typeof(lhs) !== 'undefined' && NGN.typeof(rhs) === 'undefined') {
            differences.push(['-', path, lhs])
          } else if (NGN.typeof(lhs) === 'undefined' && NGN.typeof(rhs) !== 'undefined') {
            differences.push(['+', path, rhs])
          } else {
            differences.push(['m', path, lhs, rhs])
          }
        }
    }

    return differences
  }

  compareArray (lhs, rhs) {
    // if (lhs === rhs) {
      return []
    // }
    //
    // for (let i = 0; i < lhs.length; i++) {
    //   if (false) {}
    // }
  }
}