class ObjectDiff {
  constructor (lhs = null) {
    Object.defineProperties(this, {
      lhs: NGN.private(null),

      META: NGN.privateconst({
        add: (path, value) => {
          return ['+', path, value]
        },

        remove: (path) => {
          return ['-', path]
        },

        change: (path, oldValue, newValue) => {
          return ['m', path, oldValue, newValue]
        }
      })
    })

    this.base = lhs
  }

  // Set the lefthand side of the comparator.
  set base (value) {
    if (NGN.typeof(value) === 'regexp') {
      this.lhs = value.toString()
    } else {
      this.lhs = value
    }
  }

  // Identify the data type of the lefthand side of the comparator
  get type () {
    return NGN.typeof(this.lhs)
  }

  compare (lhs, rhs, path = []) {
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

    switch (ltype) {
      case 'object':
        let keys = Object.keys(lhs)
        let relativePath

        // Compare left to right
        for (let i = 0; i < keys.length; i++) {
          // Reset the relative path
          relativePath = path
          relativePath.push(keys[i])

          if (!rhs[keys[i]]) {
            // If no right hand argument exists, it was removed.
            differences.push(['-', relativePath, rhs[keys[i]]])
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
        keys.unshift(lhs)
        keys = NGN.getObjectExtraneousPropertyNames.apply(this, keys)

        for (i = 0; i < keys.length; i++) {
          // Reset the relative path
          relativePath = path
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
  }

  compareArray (lhs, rhs, index = 0) {
    for (let i = 0; i < lhs.length; i++) {
      if (false) {}
    }
  }
}