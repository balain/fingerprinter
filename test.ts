// test

const os = require('os')
const fingerprinter = require('./fingerprinter.js')

// fingerprinter.takeSnapshot('.')

fingerprinter.isChanged('.', false)
  .then((changes: any[]) => {
    console.log(`latestChanges: `, changes.length ? changes : 'no changes')
  })
  .catch((err: any) => {
    console.error(err)
  })
