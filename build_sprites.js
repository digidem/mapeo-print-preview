var spritezero = require('@mapbox/spritezero')
var fs = require('fs')
var glob = require('glob')
var path = require('path')

if (process.argv.length !== 3) {
  console.log('USAGE: node build_sprites.js datadir')
  process.exit(1)
}
var datasetRoot = process.argv[2]

// XXX: support retina (2x and 4x) by using SIZES = [1,2,4]
var SIZES = [1]

buildPNGSprite(path.join(datasetRoot, 'icons'), function (err, res) {
  if (err) throw err

  process.stdout.write('writing icons.png..')
  fs.writeFileSync(path.join(datasetRoot, 'icons.png'), res.png, 'binary')
  console.log('..done!')

  process.stdout.write('writing icons.json..')
  fs.writeFileSync(path.join(datasetRoot, 'icons.json'), JSON.stringify(res.layout), 'utf8')
  console.log('..done!')
})

module.exports = buildPNGSprite

function buildPNGSprite (dir, cb) {
  SIZES.forEach(function (pxRatio) {
    var svgs = glob.sync('*-33px.svg', {cwd: dir})
      .map(function (f) {
        return {
          svg: fs.readFileSync(path.join(dir, f)),
          id: path.basename(f).replace('.svg', '')
        }
      })

    var pending = 2
    var errs = []
    var png
    var layout
    var opts

    // Pass `true` to the format parameter to generate a data layout
    // suitable for exporting to a JSON sprite manifest file.
    opts = { imgs: svgs, pixelRatio: pxRatio, format: true }
    spritezero.generateLayout(opts, function (err, dataLayout) {
      layout = dataLayout
      done(err)
    })

    // Pass `false` to the format parameter to generate an image layout
    // suitable for exporting to a PNG sprite image file.
    opts = { imgs: svgs, pixelRatio: pxRatio, format: false }
    spritezero.generateLayout(opts, function (err, imageLayout) {
      if (err) return done(err)
      spritezero.generateImage(imageLayout, function (err, image) {
        png = image
        done(err)
      })
    })

    function done (err) {
      if (err) errs.push(err)
      if (--pending > 0) return
      if (errs.length) console.log('errors', errs)
      cb(errs[0], errs[0] ? undefined : {png: png, layout: layout})
    }
  })
}
