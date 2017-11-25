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

  static arraysHaveMatchByRef (array1, array2, len1, len2) {
    for (let index1 = 0; index1 < len1; index1++) {
      let val1 = array1[index1]

      for (let index2 = 0; index2 < len2; index2++) {
        let val2 = array2[index2]

        if (index1 !== index2 && val1 === val2) {
          return true
        }
      }
    }
  }

  static matchItems (array1, array2, index1, index2, context) {
    let value1 = array1[index1]
    let value2 = array2[index2]

    if (value1 === value2) {
      return true
    }

    if (typeof value1 !== 'object' || typeof value2 !== 'object') {
      return false
    }

    let objectHash = context.objectHash

    if (!objectHash) {
      // no way to match objects was provided, try match by position
      return context.matchByPosition && index1 === index2
    }

    let hash1
    let hash2

    if (typeof index1 === 'number') {
      context.hashCache1 = NGN.forceArray(context.hashCache1)
      hash1 = context.hashCache1[index1]

      if (typeof hash1 === 'undefined') {
        context.hashCache1[index1] = hash1 = objectHash(value1, index1)
      }
    } else {
      hash1 = objectHash(value1)
    }

    if (typeof hash1 === 'undefined') {
      return false
    }

    if (typeof index2 === 'number') {
      context.hashCache2 = NGN.forceArray(context.hashCache2)
      hash2 = context.hashCache2[index2]

      if (typeof hash2 === 'undefined') {
        context.hashCache2[index2] = hash2 = objectHash(value2, index2)
      }
    } else {
      hash2 = objectHash(value2)
    }

    if (typeof hash2 === 'undefined') {
      return false
    }

    return hash1 === hash2
  }

  /*
   * LCS implementation that supports arrays or strings
   * reference: http://en.wikipedia.org/wiki/Longest_common_subsequence_problem
   * This code abstracted from Benjamín Eidelman's JSONDiffPatch (MIT).
   */
  static lcsDefaultMatch (array1, array2, index1, index2) {
    return array1[index1] === array2[index2]
  }

  static lcsLengthMatrix (array1, array2, match, context) {
    let len1 = array1.length
    let len2 = array2.length
    let x
    let y

    // initialize empty matrix of len1+1 x len2+1
    let matrix = [len1 + 1]

    for (x = 0; x < len1 + 1; x++) {
      matrix[x] = [len2 + 1]

      for (y = 0; y < len2 + 1; y++) {
        matrix[x][y] = 0
      }
    }

    matrix.match = match

    // save sequence lengths for each coordinate
    for (x = 1; x < len1 + 1; x++) {
      for (y = 1; y < len2 + 1; y++) {
        if (match(array1, array2, x - 1, y - 1, context)) {
          matrix[x][y] = matrix[x - 1][y - 1] + 1
        } else {
          matrix[x][y] = Math.max(matrix[x - 1][y], matrix[x][y - 1])
        }
      }
    }

    return matrix
  };

  static lcsBacktrack (matrix, array1, array2, index1, index2, context) {
    if (index1 === 0 || index2 === 0) {
      return {
        sequence: [],
        indices1: [],
        indices2: []
      }
    }

    if (matrix.match(array1, array2, index1 - 1, index2 - 1, context)) {
      let subsequence = backtrack(matrix, array1, array2, index1 - 1, index2 - 1, context)

      subsequence.sequence.push(array1[index1 - 1])
      subsequence.indices1.push(index1 - 1)
      subsequence.indices2.push(index2 - 1)

      return subsequence
    }

    if (matrix[index1][index2 - 1] > matrix[index1 - 1][index2]) {
      return backtrack(matrix, array1, array2, index1, index2 - 1, context)
    } else {
      return backtrack(matrix, array1, array2, index1 - 1, index2, context)
    }
  };

  static lcsGet (array1, array2, match, context) {
    context = context || {}

    let matrix = lengthMatrix(array1, array2, match || defaultMatch, context)
    let result = backtrack(matrix, array1, array2, array1.length, array2.length, context)

    if (typeof array1 === 'string' && typeof array2 === 'string') {
      result.sequence = result.sequence.join('')
    }

    return result
  }
}


class LCS {

}
