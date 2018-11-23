var exportGeoJson = require('osm-p2p-geojson')
var through = require('through2')
var pump = require('pump')
var fs = require('fs')
var Osm = require('osm-p2p')

module.exports = function (osm, presets) {
  var matchPreset = require('./preset-matcher')(presets.presets)
  var isPolygonFeature = require('./polygon-feature')(presets.presets)

  var out = through()

  osm.ready(function () {
    var source = osm.kv.createReadStream()
    var t = through.obj(function (entry, _, next) {
      var self = this
      Object.keys(entry.values)
        .filter(function (version) { return !entry.values[version].deleted })
        .map(function (version) {
          return Object.assign({version:version}, entry.values[version].value)
        })
        .forEach(function (elm) {
          elm.id = Math.floor(Math.random() * 10000)//entry.key
          process.stdout.write('.')
          self.push(elm)
        })
      next()
    })
    var dest = exportGeoJson(osm, {
      map: function (f) {
        var newProps = {}
        Object.keys(f.properties).forEach(function (key) {
          var newKey = key.replace(':', '_') // TODO: why?
          newProps[newKey] = f.properties[key]
        })
        f.properties = newProps
        var match = matchPreset(f)
        if (match) {
          f.properties.icon = match.icon
          f.properties.preset = match.id
        }
        return f
      },
      polygonFeatures: isPolygonFeature
    })

    pump(source, t, dest, out)
  })

  return out
}
