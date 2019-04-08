const chalk = require('chalk');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const cb = require('clearblade');
const utils = require('../utils/socketMessageUtils');
const flags = require('../../../../processFlags');

// constants
const messagePort = flags.messagePort || 1883;
const portalName = flags.portal;
const configDir = 'config/'

// setup mqtt client
const cbmeta = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../.cb-cli/cbmeta')).toString());
const systemJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../system.json')).toString());
const options = {
  systemKey: systemJson.system_key,
  systemSecret: systemJson.system_secret,
  URI: systemJson.platform_url,
  messagingURI: systemJson.messaging_url.split(':')[0],
  messagePort: messagePort,
  useUser: {
    email: cbmeta.developer_email,
    authToken: cbmeta.token
  }
};
cb.init(options);
const msg = cb.Messaging({}, () => {
  console.log(chalk.green(`MQTT connected on port ${messagePort}`));
});

// watch files
const watcher = chokidar.watch(`./portals/${portalName}/config/`);
watcher.on('change', (filepath) => {
  const slicedPath = filepath.slice(filepath.indexOf(configDir) + configDir.length);
  const thePayload = utils.parseChangedFilePath(slicedPath);
  if (thePayload) {
    console.log(chalk.green(`Reloading ${slicedPath.split('/')[1]}`));
    msg.publish(`clearblade-hot-reload/portal/${portalName}`, JSON.stringify(thePayload));
  }
})
