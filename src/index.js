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

    let configFileName = 'config'
    let day = null

    if (args.first && isNaN(args.first)) {
      configFileName = args.first
    } else {
      day = args.first
    }


    if (args.second) {
      day = args.second
    }

    const configFile = `${configFileName}.json`


    const configJson = await fs.readJson(path.join(this.config.configDir, configFile))

    this.downloadPath = configJson.downloadPath
    this.openCmd = configJson.fileOpenCmd
    this.username = configJson.username
    this.password = configJson.password
    this.loginPath = configJson.loginPath
    this.logListPath = configJson.logListPath
    this.prefix = configJson.prefixFileName
    this.postfix = configJson.postfixFileName

    this.fileName = this.getFileNameToDownload(configJson.fileName, day, this.prefix)

    this.log(this.fileName)

    // shell.exec('"C:\\Program Files\\Sublime Text 3\\subl.exe" C:\\Users\\user\\Desktop\\asoft.txt')


    this.log('clearing previous logs ...')
    await this.clearDownloadpath()

    this.log(`downloading ${this.fileName} ...`)
    await this.downloadLog()
    this.log('log file dowloaded')

    await this.unzipDownloadedLog()
    this.log('unzipped log file')

    this.openLogFile()
  }

  getFileNameToDownload(defaultFileName, day, prefix) {
    const today = new Date()
    if (day) {
      let month = today.getMonth() + 1
      const year = today.getFullYear()

      if (month < 10) {
        month = `0${month}`
      }

      if (day < 10) {
        day = `0${day}`
      }

      // valyou.2019-08-18.log.zip
      return `${prefix}.${year}-${month}-${day}.log${this.postfix}`
    }

    return defaultFileName
  }

  clearDownloadpath() {
    return new Promise((resolve, reject) => {
      try {
        fsExtra.emptyDirSync(this.downloadPath)
        resolve(true)
      } catch (e) {
        reject(e)
      }
    })
  }

  openLogFile() {

    const fileName = this.fileName.replace('.zip', '')

    const fullPath = `${this.downloadPath}${fileName}`
    this.log(`opening : ${fullPath}`)
    shell.exec(`"${this.openCmd}" ${fullPath}`)
  }

  async downloadLog() {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto(`${this.loginPath}`)


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

    await page.goto(`${this.logListPath}`)

    await page._client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: this.downloadPath
    });


    // const logLinkXpath = `//a[starts-with(., '${this.fileName}')]`

    const logLinkXpath = `//a[text() ='${this.fileName}']`
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
    const fileName = this.fileName.replace('.zip', '')

    const zipFile = `${this.downloadPath}${fileName}.zip`
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
  { name: 'first', },
  { name: 'second' }

]

DlCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({ char: 'v' }),
  // add --help flag to show CLI version
  help: flags.help({ char: 'h' }),
  name: flags.string({ char: 'n', description: 'name to print' })
}

module.exports = DlCommand
