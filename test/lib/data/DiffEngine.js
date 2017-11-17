class ObjectDiff {
  constructor (lhs = null) {
    Object.defineProperties(this, {
      lhs: NGN.private(null),

      META: NGN.privateconst({
        add: (path, value) => {
          return ['+', path, value]
        },

        remove: (path, value) => {
          return ['-', path, value]
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

  compare (lhs, rhs, path = '', differences = []) {
    let ltype = NGN.typeof(lhs)
    let rtype = NGN.typeof(rhs)

    // If the comparators aren't the same type, then
    // it is a replacement. This is identified as
    // removal of one object and creation of the other.
    if (NGN.typeof(lhs) !== NGN.typeof(rhs)) {
      differences.push(['-', '', lhs])
      differences.push(['+', '', rhs])

      return differences
    }

    let lKeys = Object.keys(lhs)

    if (ltype === 'undefined' && rtype !== 'undefined') {
      differences.push(this.META.new())
    }
  }

  diffEdit (path, origin, value) {}

  diffNew (path, value) {}

  diffDeleted (path, value) {}

  diffArray (path, index, item) {}
}