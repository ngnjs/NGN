var fs = require('fs'),
  p = require('path');

module.exports = {

  /**
   * Determines whether the current user has permissions to write to
   * global npm directory.
   */
  isElevatedUser: function () {

    var path = p.join(__dirname, '..', '..', '..');
    try {
      fs.writeFileSync(p.join(path, 'test'));
      fs.unlinkSync(p.join(path, 'test'));
      return true;
    } catch (err) {
      if (err.message.toString().toLowerCase().indexOf('permission') >= 0 || err.message.toString().toLowerCase().indexOf('access') >= 0) {
        return false;
      }
      throw err;
    }

  }

};
