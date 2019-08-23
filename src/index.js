/* eslint-disable comma-dangle */
/* eslint-disable object-curly-spacing */
const { Command, flags } = require('@oclif/command')
const fs = require('fs-extra')
const path = require('path')
const puppeteer = require('puppeteer')

// eslint-disable-next-line padded-blocks
class DlCommand extends Command {

  async run() {
    const { flags } = this.parse(DlCommand)
    const { args } = this.parse(DlCommand)
    const name = flags.name || 'world'
    this.log(`hello ${name} from .\\src\\index.js`)

    // const configJson = await fs.readJson(path.join(this.config.configDir, 'config.json'))
    // this.log(`config => ${configJson.path}`)

    this.browse()
  }

  async browse() {
    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()
    await page.goto('http://innov8tifip.ddns.net:9086/valyou/admin/login')

    await page.type('#username', 'admin')

    const edts = await page.$x('//*[@id="main"]/form/input[2]')
    const edtPass = edts[0]
    await edtPass.type('admin')


    const btns = await page.$x('//*[@id="main"]/form/button')
    const btnLogin = btns[0]

    await Promise.all([
      page.waitForNavigation(),
      btnLogin.click()
    ])

    // await btnLogin.click()

    await page.goto('http://innov8tifip.ddns.net:9086/valyou/admin/log/list')

    const links = await page.$x("//a[contains(., 'valyou.log')]")
    const logLinks = links[0]

    await logLinks.click()

    await page.screenshot({ path: 'example.png' })


    await browser.close()
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
