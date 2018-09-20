module.exports = function () {
  return {
    name: 'metamodel',
    idField: 'testid',

    fields: {
      firstname: null,
      lastname: null,
      val: {
        min: 10,
        max: 20,
        default: 15
      },
      testid: null,
      virtual: function () {
        return 'test ' + this.val
      }
    }
  }
}
