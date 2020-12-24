# fingerprinter

Take a (recursive) snapshot of a folder & compare against earlier snapshots

## Dependencies
* TypeScript installed (`tsc`)
* Node modules
  * `md5-file`: Capture MD5 for individual files [https://github.com/kodie/md5-file](https://github.com/kodie/md5-file)

## Installation and Setup
1. *Pull* `git pull https://github.com/balain/fingerprinter`
1. *Install Node modules* `npm install`
1. *Compile* `tsc fingerprinter.ts`

## Running
1. *Take a snapshot* `node fingerprinter.js add <relative_path> > <output.json>`
1. *Compare a directory with an earlier snapshot* `node fingerprinter.js check <relative_path> <snapshot.json>`

## File Format
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

[https://github.com/balain/](https://github.com/balain/)