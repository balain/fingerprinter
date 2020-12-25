# fingerprinter

Take a (recursive) snapshot of a folder & compare against earlier snapshots.

Minimal external dependencies - only `md5-file` (to fingerprint individual files) & `crypto` (to set the snapshot filename, based on the full directory pathname)

The simple intent is to identify what files need to be uploaded to a remote webserver after a local static site rebuild (e.g. using Hugo). `git` could provide the same functionality, but brings a lot of baggage. This tool is very lightweight and simple to use with minimal dependencies.

## External Dependencies
* TypeScript installed (`tsc`)
* Node modules
  * `md5-file`: Capture MD5 for individual files [https://github.com/kodie/md5-file](https://github.com/kodie/md5-file)
  * `crypto`: For SHA256 hash of pathname (i.e. the snapshot filename)

## Installation and Setup
1. *Pull* `git pull https://github.com/balain/fingerprinter`
1. *Install Node modules* `npm install`
1. *Compile* `npm run build` (or `tsc` or `tsc --watch`)

## Functions
1. `takeSnapshot(pathname)`: Takes a snapshot of the path provided. Nothing is returned.
1. `isChanged(pathname, updateSnapshot=false)`: Compare the current contents with the previous snapshot, optionally updating the snapshot file to the current contents (default: do not update the snapshot file). (Promise)
  * Returns an array - empty if no changes, otherwise, a list of filenames that have changed.
  * Throws an error if the snapshot doesn't exist.

## Running
### From the commandline
* `node fingerprinter.js add <pathname>` to take a snapshot
* `node fingerprinter.js check <pathname>` to calculate the delta

### In a Node script (via require...)
```
const fingerprinter = require('./fingerprinter.js')

// Take an explicit snapshot
// fingerprinter.takeSnapshot('.')

// Has anything has changed since the previous snapshot?
// ...do not update the snapshot file
fingerprinter.isChanged('.', false)
  .then((changes: any[]) => {
    console.log(`latestChanges: `, changes.length ? changes : 'no changes')
  })

// Has anything has changed since the previous snapshot?
// ...update the snapshot file
fingerprinter.isChanged('.', true)
  .then((changes: any[]) => {
    console.log(`latestChanges: `, changes.length ? changes : 'no changes')
  })

```

## Snapshot File Info
### Filename
`sha256(absolutePathname)` saved in the OS temp directory (per `os.tmpdir()`)
### File Format
```
[
  {
  "path": "...",
  "processDate": "...",
  "files": [
    { "name": "A",
      "md5": "..." }, 
    ...
  ]
]
```

## License

Distributed under the MIT license. See ``LICENSE`` for more information.

[https://github.com/balain/fingerprinter](https://github.com/balain/fingerprinter)