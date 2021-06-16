
const FS = require("fs")
const Path = require("path")
const OS = require('os')

const debug = require('debug')('fingerprinter')

const md5File = require("md5-file") // To capture the fingerprint of each file
const fcrypto = require('crypto')

// Processed data
var files: any[] = []

// List of directories to exclude
let EXCLUDE_DIR = ['.git', 'node_modules']
// List of files to exclude
let EXCLUDE_FILE = []

let delta: any[] = []
let priorChanges: any[] = []

/**
 * Should the directory be processed?
 * @param  {string} dirName Relative path name
 * @returns {boolean} false if the directory is in the EXCLUDE list; true otherwise
 */
function includeDirectory(dirName: string): boolean {
  for (let i = 0; i < EXCLUDE_DIR.length; i++) {
    if (dirName.includes(EXCLUDE_DIR[i])) {
      return false // Escape as soon as possible
    }
  }
  return true
}

/**
 * Read the contents of the selected folder
 * @param  {string} dir Directory starting point
 * @returns Array of files with relative paths
 */
function processDirectory(dir: string): any {
  return new Promise<any[]>((resolve, reject) => {
    FS.readdirSync(dir).forEach((file: string) => {
      const absPath: string = Path.join(dir, file);
      if (FS.statSync(absPath).isDirectory()) {
        if (includeDirectory(absPath)) {
          return processDirectory(absPath)
        }
      } else {
        if (includeDirectory(absPath)) {
          const hash: string = md5File.sync(absPath)
          files.push({ name: absPath, md5: hash })
        }
      }
    })
    resolve(files)
  })
}

/**
 * Store a snapshot in a standard location (temp folder)
 * @param  {string} dir Full path of the directory
 */
function takeSnapshot(dir: string): void {
  const absPath = Path.resolve(dir)
  console.error(`adding ${dir}/${absPath}`)
  try {
    debug(`processing ${dir}`)
    process.chdir(dir)
    processDirectory('.')
      .then((fileList: string[]) => {
        debug(`saving snapshot with ${fileList.length} files`)
        saveSnapshot({ path: absPath, processDate: new Date(), files: fileList })
        console.log(`Saved snapshot!`)
      })
      .catch((err: any) => {
        console.error(`ERROR: ${err}`)
      })
  } catch (err) {
    console.error(`ERROR: ${err.message}`)
  }
}

// Snapshot filename == sha256(dir)
function getSnapshotFilename(dir: string): any {
  debug(`getSnapshotFilename(${dir}) called`)
  const hash = fcrypto.createHash('sha256')
  const hashVal = hash.update(dir).digest('hex')
  const filename = OS.tmpdir() + Path.sep + hashVal
  debug(`...result: ${filename}, ${hashVal}`)
  return ({ filename: filename, hash: hashVal })
}

function saveSnapshot(data: any) {
  debug(`saveSnapshot(${data}) called`)
  const tmpFileInfo = getSnapshotFilename(data.path)
  data.tmpFilename = tmpFileInfo.filename
  data.pathHash = tmpFileInfo.hash
  debug(`...result: ${tmpFileInfo.filename}, data`)
  FS.writeFileSync(tmpFileInfo.filename, JSON.stringify(data))
}

/**
 * Has the directory changed since the prior snapshot?
 * @param  {string} dir
 * @returns {boolean} Yes (true) or No (false)
 */
async function isChanged(dir: string, updateSnapshot: boolean = false): Promise<any> {
  debug(`isChanged(${dir}, ${updateSnapshot}) called`)
  const absPath = Path.resolve(dir)
  const snapshotFileInfo = getSnapshotFilename(absPath)
  debug(`snapshotFileInfo: ${snapshotFileInfo}`)
  let fingerprint: string = snapshotFileInfo.filename
  // Get the old results (i.e. read the local fingerprint file)
  if (FS.existsSync(fingerprint)) {
    let oldResults: any = JSON.parse(FS.readFileSync(fingerprint, 'utf8'))
    debug(`...got the oldResults (fingerprint: ${fingerprint})`)
    // Get the current values
    debug(`...chdir(${dir})`)
    process.chdir(dir) // Change to the processing folder so all relative paths are sane
    const fileList: string[] = await processDirectory('.')
    debug(`...fileList: ${fileList.length} items long`)
    // .then((fileList: string[]) => {
    delta = []
    // Get the current results
    let newResults: any = { path: absPath, processDate: new Date(), files: fileList }
    debug(`...newResults: ${absPath}, ${fileList.length} files`)
    // Now compare
    // TODO: Process the file data by content, rather than position
    if (newResults.files.length == oldResults.files.length) {
      debug(`......same # of files: ${newResults.files.length}`)
      for (let i = 0; i < newResults.files.length; i++) {
        if ((newResults.files[i].name != oldResults.files[i].name)) {
          delta.push({ new: newResults.files[i].name, old: oldResults.files[i].name })
        }
        else if ((newResults.files[i].md5 != oldResults.files[i].md5)) {
          delta.push(newResults.files[i].name)
        }
      }
      if (updateSnapshot) {
        debug(`......saving snapshot`)
        saveSnapshot(newResults)
      } else {
        debug(`......not saving snapshot`)
      }
      return (delta)
    } else {
      debug(`......** Different *** # of files: new:${newResults.files.length} vs old:${oldResults.files.length}`)
      if (updateSnapshot) {
        debug(`......saving snapshot`)
        saveSnapshot(newResults)
      } else {
        debug(`......not saving snapshot`)
      }
      delta = [{ new: newResults.files, old: oldResults.files }]
    }
  } else { // Snapshot file doesn't exist
    throw new Error('Snapshot file not found. Please take a snapshot first.')
  }
}

module.exports = { isChanged, takeSnapshot }

if (require.main === module) {
  debug(`in main`)
  const action = process.argv.slice(2)[0]
  const pathName = process.argv.slice(2)[1]
  switch (action) {
    case 'add':
      takeSnapshot(pathName)
      break;
    case 'check':
      isChanged(pathName, true)
        .then((changes: any[]) => {
          console.log(`latestChanges: `, changes.length ? changes : 'no changes')
        })
        .catch((err: any) => {
          console.error(err.message)
        })
      break;
    default:
      console.error(`Please specify either 'add' or 'check' - plus a directory name.`)
      break;
  }
}