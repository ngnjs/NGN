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
        if (this.#related.has(rel)) {
          const other = rel.base === this.#base ? rel.related : rel.base
          rel.destroy()
          this.#related.delete(rel)
          if (other.related && other.related instanceof Relationships) {
            other.related.destroy(rel)
          }
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
    if (!value) {
      this.parents = null
      return
    }

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
    value = new Set(Array.from(value || []))

    for (const rel of this.#related) {
      if (rel.type === 'parent' && rel.related === this.#base) {
        if (!value.has(rel.base)) {
          this.destroy(rel)
        } else {
          value.delete(rel.base)
        }
      }
    }

    this.addParent(...value)
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
    if (!value) {
      this.children = null
      return
    }

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
    value = new Set(Array.from(value || []))

    for (const rel of this.#related) {
      if (rel.type === 'parent' && rel.base === this.#base) {
        if (!value.has(rel.related)) {
          this.destroy(rel)
        } else {
          value.delete(rel.related)
        }
      }
    }

    this.addChild(...value)
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
    if (!value) {
      this.siblings = null
      return
    }

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

  set siblings (value) {
    value = new Set(Array.from(value || []))

    for (const rel of this.#related) {
      if (rel.type === 'sibling') {
        if (!value.has(rel.related) && !value.has(rel.base)) {
          this.destroy(rel)
        } else {
          value.delete(rel.related)
          value.delete(rel.base)
        }
      }
    }

    this.addSibling(...value)
  }

  addSibling () {
    for (const sibling of arguments) {
      this.add(this.#base, sibling, 'sibling')
    }
  }

  clear () {
    for (const rel of this.#related) {
      rel.destroy()
    }

    this.#related = new Set()
  }

  clearParents () {
    for (const rel of this.#related) {
      if (rel.type === 'parent' && rel.related === this.#base) {
        this.destroy(rel)
      }
    }
  }

  clearChildren () {
    for (const rel of this.#related) {
      if (rel.type === 'parent' && rel.base === this.#base) {
        this.destroy(rel)
      }
    }
  }

  clearSiblings () {
    for (const rel of this.#related) {
      if (rel.type === 'sibling') {
        this.destroy(rel)
      }
    }
  }
}
