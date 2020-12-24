import FS from "fs"
import Path from "path"
const md5File = require("md5-file") // To capture the fingerprint of each file

// Processed data
var files: any[] = []

// List of directories to exclude
let EXCLUDE_DIR = ['.git', 'node_modules']
// List of files to exclude
let EXCLUDE_FILE = []

/**
 * Should the directory be processed?
 * @param  {string} dirName Relative path name
 * @returns {boolean} false if the directory is in the EXCLUDE list; true otherwise
 */
function includeDirectory(dirName: string) {
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
function processDirectory(dir: string) {
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

try {
  const cmd: string = process.argv.slice(2)[0]
  let dir: string = process.argv.slice(2)[1]
  console.error(`cmd: ${cmd}; dir: ${dir}`)
  const absPath = Path.resolve(dir)
  switch (cmd) {
    case 'add':
      console.error(`adding ${dir}`)
      process.chdir(dir)
      processDirectory('.')
        .then((fileList: string[]) => {
          const results = { path: absPath, processDate: new Date(), files: fileList }
          console.log(JSON.stringify(results))
        })
        .catch((err) => {
          console.error(`ERROR: ${err}`)
        })
      break;
    case 'check':
      // TODO: Fix the command-line processing
      let fingerprint: string = process.argv.slice(2)[2]
      console.error(`checking ${dir} against ${fingerprint}`)
      // Get the old results (i.e. read the local fingerprint file)
      let oldResults: any = JSON.parse(FS.readFileSync(fingerprint, 'utf8'))
      // Get the current values
      process.chdir(dir) // Change to the processing folder so all relative paths are sane
      processDirectory('.')
        .then((fileList: string[]) => {
          const delta = [] // Capture differences
          // Get the current results
          let newResults: any = { path: absPath, processDate: new Date(), files: fileList }
          // Now compare
          // TODO: Process the file data by content, rather than position
          if (newResults.files.length == oldResults.files.length) {
            for (let i = 0; i < newResults.files.length; i++) {
              if (
                (newResults.files[i].name != oldResults.files[i].name) ||
                (newResults.files[i].md5 != oldResults.files[i].md5)
              ) {
                delta.push({ new: newResults.files[i], old: oldResults.files[i] })
              }
            }
            if (delta.length) {
              console.error(`Differences: `, delta)
            } else {
              console.log(`No change`)
            }
          } else {
            console.log(newResults.files)
            console.log(`different lengths: New: ${newResults.files.length} vs. Old: ${oldResults.files.length}`)
          }
        })
        .catch((err) => {
          console.error(`ERROR: ${err}`)
        })
      break;
    default:
      break;
  }
} catch (err) {
  console.error(`ERROR: ${err}`)
}
