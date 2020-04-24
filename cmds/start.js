const chalk = require('chalk');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const cb = require('clearblade');
const utils = require('../utils/socketMessageUtils');
const error = require('../utils/error');
const flags = require(path.resolve('./.cb-dev-kit/processFlags'));
const fetch = require('node-fetch');

// constants
const messagePort = flags.messagePort || 8903;
const useSSL = flags.noSSL ? false : true;
const caPath = flags.caPath || path.join(__dirname, '../ca.pem');
const portalName = flags.portal;
const configDir = 'config/'

// setup mqtt client
const cbmeta = JSON.parse(fs.readFileSync(path.resolve('./.cb-cli/cbmeta')).toString());
const systemJson = JSON.parse(fs.readFileSync(path.resolve('./system.json')).toString());
const initOptions = {
  systemKey: systemJson.system_key,
  systemSecret: systemJson.system_secret,
  URI: systemJson.platform_url,
  messagingURI: systemJson.messaging_url.split(':')[0],
  messagingPort: messagePort,
  useUser: {
    email: cbmeta.developer_email,
    authToken: cbmeta.token
  }
};

const sslOptions = {};
if (useSSL === true) {
  sslOptions.useSSL = true;
  sslOptions.ca = fs.readFileSync(caPath)
} else if (systemJson.platform_url.split(':')[0] === 'https') {
  error(`Remove -noSSL flag or set to false to point at local platform`, true);
}

const checkAuth = () => fetch(`${initOptions.URI}/admin/checkauth`, {
  method: 'POST',
  headers: {
    'Clearblade-SystemKey': initOptions.systemKey,
    'ClearBlade-DevToken': initOptions.useUser.authToken,
  }
});

let msg;

const onMessagingSuccess = () => {
  console.log(chalk.green(`MQTT connected on port ${messagePort}`));
  const watcher = chokidar.watch(`./portals/${portalName}/config/`);
  watcher.on('change', (filepath) => {
    const slicedPath = filepath.slice(filepath.indexOf(configDir) + configDir.length);
    const thePayload = utils.parseChangedFilePath(slicedPath);
    if (thePayload) {
      msg.publish(`clearblade-hot-reload/portal/${portalName}`, JSON.stringify(thePayload));
      console.log(chalk.green(`Reloading ${slicedPath.split('/')[1]}`));
    }
  })
}

const initCallback = () => {
  checkAuth().then((resp) => {
    resp.json().then((body) => {
      if (body.is_authenticated) {
        msg = cb.Messaging(sslOptions, onMessagingSuccess);
      } else if (body.error) {
        error(`Error establishing MQTT connection: ${body.error.message} - ${body.error.detail}`)
      }
    })
  }).catch((e) => {
    error(`Error checking auth token: ${JSON.stringify(e)}`)
  })
}

module.exports = function() {
  cb.init(initOptions)
  setTimeout(() => {
    initCallback();
  }, 4000);
}

