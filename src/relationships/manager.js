import Relationship from './relationship.js'
import BASE from '../base.js'

export default class Relationships {
  #related = new Set()
  #base

  constructor (base) {
    this.#base = base

    Object.defineProperties(this, {
      insert: BASE.hiddenconstant.value(rel => this.#related.add(rel)),
      add: BASE.hiddenconstant.value((base, related, type = 'parent') => {
        const rel = new Relationship(base, related, type)
        const other = base === this.#base ? related : base

        this.#related.add(rel)

        if (other.related && other.related instanceof Relationships) {
          other.related.insert(rel)
        }
      }),
      destroy: BASE.hiddenconstant.value(rel => {
        const other = rel.base === this.#base ? rel.related : rel.base
        rel.destroy()
        this.#related.remove(rel)
        if (other.related && other.related instanceof Relationships) {
          other.related.destroy(rel)
        }
      })
    })
  }

  get size () {
    return this.#related.size
  }

  get parent () {
    for (const rel of this.#related) {
      if (rel.type === 'parent' && rel.related === this.#base) {
        return rel.base
      }
    }

    return null
  }

  set parent (value) {
    const p = this.parent

    if (p !== value) {
      if (p !== null) {
        for (const rel of this.#related) {
          if (rel.type === 'parent' && rel.base === p) {
            rel.destroy()
            break
          }
        }
      }

      if (value !== null) {
        this.add(value, this.#base)
      }
    }
  }

  addParent () {
    for (const parent of arguments) {
      this.add(parent, this.#base)
    }
  }

  get parents () {
    const result = new Set()

    for (const rel of this.#related) {
      if (rel.type === 'parent' && rel.related === this.#base) {
        result.add(rel.base)
      }
    }

    return Array.from(result)
  }

  set parents (value) {
    value = new Set(Array.from(value))

    this.parents.forEach(rel => {
      if (value.has(rel.base)) {
        value.delete(rel)
      } else {
        this.destroy(rel)
      }
    })

    value.forEach(parent => this.add(parent, this.#base))
  }

  get child () {
    for (const rel of this.#related) {
      if (rel.type === 'parent' && rel.base === this.#base) {
        return rel.related
      }
    }

    return null
  }

  set child (value) {
    const p = this.child

    if (p !== value) {
      if (p !== null) {
        for (const rel of this.#related) {
          if (rel.type === 'parent' && rel.related === p) {
            rel.destroy()
            break
          }
        }
      }

      if (value !== null) {
        this.add(this.#base, value)
      }
    }
  }

  get children () {
    const result = new Set()

    for (const rel of this.#related) {
      if (rel.type === 'parent' && rel.base === this.#base) {
        result.add(rel.related)
      }
    }

    return Array.from(result)
  }

  set children (value) {
    value = new Set(Array.from(value))

    this.children.forEach(rel => {
      if (value.has(rel.related)) {
        value.delete(rel)
      } else {
        this.destroy(rel)
      }
    })

    value.forEach(child => this.add(this.#base, child))
  }

  addChild () {
    for (const child of arguments) {
      this.add(this.#base, child)
    }
  }

  get sibling () {
    for (const rel of this.#related) {
      if (rel.type === 'sibling') {
        return rel.base === this.#base ? rel.related : rel.base
      }
    }

    return null
  }

  set sibling (value) {
    const p = this.sibling

    if (p !== value) {
      if (p !== null) {
        for (const rel of this.#related) {
          if (rel.type === 'sibling' && rel.related === p) {
            rel.destroy()
            break
          }
        }
      }

      if (value !== null) {
        this.add(this.#base, value, 'sibling')
      }
    }
  }

  get siblings () {
    const result = new Set()

    for (const rel of this.#related) {
      if (rel.type === 'sibling') {
        result.add(rel.base === this.#base ? rel.related : rel.base)
      }
    }

    return Array.from(result)
  }

  addSibling () {
    for (const child of arguments) {
      this.add(this.#base, child)
    }
  }

  clear () {
    for (const rel of this.#related) {
      rel.destroy()
    }

    this.#related = new Set()
  }

  clearParents () {
    this.parents.forEach(this.destroy)
  }

  clearChildren () {
    this.children.forEach(this.destroy)
  }

  clearSiblings () {
    this.siblings.forEach(this.destroy)
  }
}
