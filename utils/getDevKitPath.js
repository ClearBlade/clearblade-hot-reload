const fs = require('fs');
const path = require('path');

module.exports = {
  default: fs.existsSync(path.resolve('./cb-dev-kit')) ? 'cb-dev-kit' : '.cb-dev-kit'
}