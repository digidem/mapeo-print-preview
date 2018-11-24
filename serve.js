var Osm = require('osm-p2p')
var geojsonvt = require('geojson-vt')
var collect = require('collect-stream')
var http = require('http')
var fs = require('fs')
var vt2pbf = require('vt-pbf')
var zlib = require('zlib')
var path = require('path')

var osmExport = require('./lib/export')

if (process.argv.length !== 3) {
  console.log('USAGE: node serve.js datadir')
  process.exit(1)
}

var datasetRoot = process.argv[2]
var layerify = require('./' + path.join('.', datasetRoot, 'layerify.js'))
var presets = JSON.parse(fs.readFileSync(path.join(datasetRoot, 'presets.json'), 'utf8'))
var osm = Osm(path.join(datasetRoot, 'osm'))

function index (cb) {
  var presetsPath = path.join(datasetRoot, 'geo.json')
  if (fs.existsSync(presetsPath)) {
    fs.readFile(presetsPath, 'utf8', parseGeoJson)
  } else {
    console.log(presetsPath, 'not found. Run export.js to generate it.')
    process.exit(1)
  }

  function parseGeoJson (err, rawGeojson) {
    if (err) throw err
    console.log('parsing geojson..')
    var geojson = JSON.parse(rawGeojson)
    console.log('generating tiles..')
    var tiles = geojsonvt(geojson, {
      debug: 3,
      generateId: true,
      tolerance: 0
    })
    console.log('..done')
    cb(null, tiles)
  }
}

index(function (err, tiles) {
  if (err) throw err

  http.createServer(function (req, res) {
    console.log(req.url)
    if (req.url === '/') return fs.createReadStream('static/index.html').pipe(res)
    else if (req.url === '/icons.json') {
      fs.createReadStream(path.join(datasetRoot, 'icons.json')).pipe(res)
      return
    } else if (req.url === '/icons.png') {
      fs.createReadStream(path.join(datasetRoot, 'icons.png')).pipe(res)
      return
    } else if (req.url === '/style.json') {
      fs.createReadStream(path.join(datasetRoot, 'style.json')).pipe(res)
      return
    } else if (/^\/Noto%20Sans%20Regular\/.*\.pbf$/.test(req.url)) {
      var m = req.url.match(/^\/Noto%20Sans%20Regular\/(.*)\.pbf$/)
      if (m) {
        fs.createReadStream('static/Noto Sans Regular/' + m[1] + '.pbf').pipe(res)
      } else {
        res.statusCode = 404
        res.end()
      }
      return
    }

    // treat any other request as a request for a vector tile
    var m = req.url.match(/\/(\d+)\/(\d+)\/(\d+).mvt$/)
    if (m) {
      console.log('fetching', m[1], m[2], m[3])
      var z = parseInt(m[1])
      var x = parseInt(m[2])
      var y = parseInt(m[3])
      var tile = tiles.getTile(z, x, y)
      if (!tile) {
        res.setHeader('Content-Type', 'application/vnd.mapbox-vector-tile')
        res.setHeader('Content-Length', 0)
        res.statusCode = 404
        return res.end()
      }
      var layers = layerify(tile)
      var arr = Buffer.from(vt2pbf.fromGeojsonVt(layers, {version:2.1}))
      var rez = zlib.gzipSync(arr)
      res.setHeader('Content-Type', 'application/vnd.mapbox-vector-tile')
      res.setHeader('Content-Encoding', 'gzip')
      res.end(rez)
    } else {
      console.log('wtf')
      res.statusCode = 404
      res.end()
    }
  })
    .listen(5050, function () {
      console.log('listening on http://localhost:5050')
    })
})
