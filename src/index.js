/* eslint-disable object-curly-spacing */
const { Command, flags } = require('@oclif/command')
const fs = require('fs-extra')
const path = require('path')


// eslint-disable-next-line padded-blocks
class DlCommand extends Command {

  async run() {
    const { flags } = this.parse(DlCommand)
    const { args } = this.parse(DlCommand)
    const name = flags.name || 'world'
    this.log(`hello ${name} from .\\src\\index.js`)

    const configJson = await fs.readJson(path.join(this.config.configDir, 'config.json'))
    this.log(`config => ${configJson.path}`)

  }
}

DlCommand.description = `Describe the command here


...
Extra documentation goes here
`

DlCommand.args = [
  { name: 'firstFlag' },
  { name: 'secondFlag' },
]

DlCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({ char: 'v' }),
  // add --help flag to show CLI version
  help: flags.help({ char: 'h' }),
  name: flags.string({ char: 'n', description: 'name to print' }),
}

module.exports = DlCommand
