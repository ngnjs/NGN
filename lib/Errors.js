/* global MissingConstructorError */

/**
 * @error MissingConstructorError
 * Thrown when a class does not have the required constructor method.
 */
global.MissingConstructorError = NGN.createException({
  name: 'Missing Constructor Error',
  type: 'MissingConstructorError',
  severity: 'critical',
  message: 'The class has no constructor',
  custom: {
    help: 'Check the class to assure a constructor exists.',
    cause: 'Misspelling is most common cause. It should be "constructor".'
  }
});
