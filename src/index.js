const { Command, flags } = require('@oclif/command')
const fs = require('fs-extra')
const path = require('path')
const puppeteer = require('puppeteer')
const shell = require('shelljs')
const Zip = require('adm-zip')
const fsExtra = require('fs-extra')

// eslint-disable-next-line padded-blocks
class DlCommand extends Command {

  async run() {
    const { flags } = this.parse(DlCommand)
    const { args } = this.parse(DlCommand)
    const name = flags.name || 'world'

    const configJson = await fs.readJson(path.join(this.config.configDir, 'config.json'))

    this.downloadPath = configJson.downloadPath
    this.fileName = configJson.fileName
    this.openCmd = configJson.fileOpenCmd
    this.username = configJson.username
    this.password = configJson.password

    // shell.exec('"C:\\Program Files\\Sublime Text 3\\subl.exe" C:\\Users\\user\\Desktop\\asoft.txt')


    this.log('clearing previous logs ...')
    await this.clearDownloadpath()

    this.log('downloading log file ...')
    await this.downloadLog()
    this.log('log file dowloaded')

    await this.unzipDownloadedLog()
    this.log('unzipped log file')

    this.openLogFile()
  }


  clearDownloadpath() {
    return new Promise((resolve, reject) => {
      try{  
        fsExtra.emptyDirSync(this.downloadPath)
        resolve(true)
      }catch(e){
        reject(e)
      }
    })
  }

  openLogFile() {
    const fullPath = `${this.downloadPath}${this.fileName}`
    this.log(`opening : ${fullPath}`)
    shell.exec(`"${this.openCmd}" ${fullPath}`)
  }

  async downloadLog() {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto('http://innov8tifip.ddns.net:9086/valyou/admin/login')

    await page.type('#username', this.username)

    const edts = await page.$x('//*[@id="main"]/form/input[2]')
    const edtPass = edts[0]
    await edtPass.type(this.password)

    const btns = await page.$x('//*[@id="main"]/form/button')
    const btnLogin = btns[0]

    await Promise.all([
      page.waitForNavigation(),
      btnLogin.click()
    ])

    await page.goto('http://innov8tifip.ddns.net:9086/valyou/admin/log/list')


    await page._client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: this.downloadPath
    });


    const logLinkXpath = `//a[contains(., '${this.fileName}')]`
    const links = await page.$x(logLinkXpath)
    const logLinks = links[0]


    await Promise.all([
      await logLinks.click(),
      await this.waitForFileDownload()
    ])

    await page.screenshot({ path: 'example.png' })


    await browser.close()
  }

  waitForFileDownload() {
    return new Promise((resolve, reject) => {
      try {
        let fileName;
        while (!fileName || fileName.endsWith('crdownload')) {
          const fileList = fs.readdirSync(this.downloadPath)

          if (fileList) {
            fileName = fileList[0]
          }
          // this.log(fileName)
        }
        resolve(true)
      } catch (e) {
        reject(e)
      }
    })
  }

  unzipDownloadedLog() {
    const zipFile = `${this.downloadPath}${this.fileName}.zip`
    const zip = new Zip(zipFile)

    return new Promise((resolve, reject) => {
      try {
        zip.extractAllTo(this.downloadPath, true)
        resolve()
      } catch (e) {
        reject(e)
      }
    })
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
