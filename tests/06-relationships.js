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
    t.expect(1, Child.related.size, 'Relationship recognized by child.')

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

test('Multi-parent Relationships', t => {
  const Mom = new EventEmitter({
    name: 'Mom'
  })

  const Dad = new EventEmitter({
    name: 'Dad'
  })

  Mom.on('relationship', relation => {
    t.expect(2, Child.related.size, 'Relationships recognized by child.')
    t.expect(1, Mom.related.size, 'Relationship recognized by primary parent.')
    t.expect(1, Dad.related.size, 'Relationship recognized by secondary parent.')

    Child.related.parents = null // Removes the parent/child relationship
  })

  Dad.on('relationship.destroy', () => {
    t.pass('Relationship removal emits a relationship.destroy event.')
    t.expect(0, Mom.related.size, 'Relationship removed by primary parent.')
    t.expect(0, Dad.related.size, 'Relationship removed by secondary parent.')

    t.end()
  })

  const Child = new EventEmitter({
    name: 'Child',
    parents: [Mom, Dad]
  })
})

test('Child Relationships', t => {
  const Mom = new EventEmitter({
    name: 'Mom'
  })

  Mom.after('relationship', 2, () => {
    t.expect(2, Mom.related.size, 'Relationships recognized by parent.')
    t.expect(1, Brother.related.size, 'Relationship recognized by primary child.')
    t.expect(1, Sister.related.size, 'Relationship recognized by secondary child.')
    t.expect(Mom, Brother.related.parent, 'Parent recognized by primary child.')
    t.expect(Mom, Sister.related.parent, 'Parent recognized by secondary child.')

    const kids = new Set(Mom.related.children)
    t.ok(kids.has(Brother) && kids.has(Sister), 'All children recognized by parent.')

    Mom.related.children = null // Removes the parent/child relationship
  })

  Mom.after('relationship.destroy', 2, () => {
    t.pass('Relationship removal emits a relationship.destroy event.')
    t.expect(0, Brother.related.size, 'Relationship removed by primary child.')
    t.expect(0, Sister.related.size, 'Relationship removed by secondary child.')
    t.expect(0, Mom.related.size, 'Relationships removed by parent.')

    t.end()
  })

  const Brother = new EventEmitter({
    name: 'Brother',
    parent: Mom
  })

  const Sister = new EventEmitter({
    name: 'Sister',
    parent: Mom
  })
})


test('Sibling Relationships', t => {
  const Brother = new EventEmitter({
    name: 'Brother'
  })

  Brother.on('relationship', rel => {
    t.expect('sibling', rel.type, 'Recognized sibling relationship in event payload.')
    t.expect(1, Sister.related.size, 'Sibling 1 recognizes relationship.')
    t.expect(1, Brother.related.size, 'Sibling 2 recognizes relationship.')
    t.expect(Brother, Sister.related.sibling, 'Sibling 1 recognizes Sibling 2.')
    t.expect(Sister, Brother.related.sibling, 'Sibling 2 recognizes Sibling 1.')

    Sister.on('relationship', rel => {
      t.expect(2, Sister.related.size, 'Central sibling recognizes other siblings.')
      t.expect(1, Brother.related.size, 'Related sibling only recognizes main sibling.')
      t.expect(1, AnotherBrother.related.size, 'Secondary related sibling only recognizes main sibling.')

      t.end()
    })

    const AnotherBrother = new EventEmitter({
      name: 'AnotherBrother',
      sibling: Sister
    })
  })

  const Sister = new EventEmitter({
    name: 'Sister',
    sibling: Brother
  })
})