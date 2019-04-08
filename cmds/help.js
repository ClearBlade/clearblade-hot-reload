const menus = {
  main: `
    clearblade-hot-reload [command]

    start .............. create MQTT connection to send watched file changes with
    version ............ show package version
    help ............... show help menu for a command`,

  start: `
    clearblade-hot-reload start`
}

module.exports = (args) => {
  const subCmd = args._[0] === 'help'
    ? args._[1]
    : args._[0]

  console.log(menus[subCmd] || menus.main)
}