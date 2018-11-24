var path = require('path')
var fs = require('fs')
var Osm = require('osm-p2p')
var exportOsm = require('./lib/export')

if (process.argv.length !== 3) {
  console.log('USAGE: node export.js datadir')
  process.exit(1)
}

var datasetRoot = process.argv[2]
var presets = JSON.parse(fs.readFileSync(path.join(datasetRoot, 'presets.json'), 'utf8'))
var osm = Osm(path.join(datasetRoot, 'osm'))

osm.ready(function () {
  var output = exportOsm(osm, presets)
  output.pipe(fs.createWriteStream(path.join(datasetRoot, 'geo.json')))
  output.once('end', function () {
    console.log('done')
  })
})
