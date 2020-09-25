import test from 'tappedout'
import { EventEmitter } from 'ngn'

test('Parent-Child Relationships', t => {
  const Parent = new EventEmitter({
    name: 'Parent'
  })

  Parent.on('relationship', relation => {
    t.expect(Parent, relation.base, 'Relationship identifies parent.')
    t.expect(Child, relation.related, 'Relationship identifies child.')
    t.expect('parent', relation.type, 'Relationship identifies type.')
    t.expect(1, Parent.related.size, 'Relationship recognized by parent.')

    Child.related.parent = null // Removes the parent/child relationship
  })

  Parent.on('relationship.destroy', () => {
    t.pass('Relationship removal emits a relationship.destroy event.')
    t.end()
  })

  const Child = new EventEmitter({
    name: 'Child',
    parent: Parent
  })
})
