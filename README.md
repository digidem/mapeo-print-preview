# mapeo-print-preview

This is an experimental repository, supporting a larger effort to bring *web vector tile rendering* to [Mapeo Desktop](https://github.com/digidem/mapeo-desktop).

## What is this?

This repo is a collection of three command line scripts that build the necessary resources to render an [osm-p2p-db](https://github.com/digidem/osm-p2p-db), plus some additional data, as an interactive [mapbox-gl-js](https://github.com/mapbox/mapbox-gl-js) web map.

## Usage

The scripts all take a `dataset` parameter, which is a path to a directory.

Here is a listing of the files that need to appear in that dataset directory (`waorani/` above) and where they currently come from:

- Pre-Made
  - `presets.json`: a list of presets, fields, categories, and defaults. This is
    described by the [iD presets format](https://github.com/openstreetmap/iD/blob/master/data/presets/README.md),
    and concatenated into a single JSON file.
  - `icons/`: a directory of SVGs icons, referenced by the presets in
    `presets.json`.
  - `layerify.js`: not generally needed; a hack for one of our datasets (wao).
    We're cutting up the OSM data into layers dynamically as they are served,
    but we plan to phase this out, since it adds a lot of complexity.
  - `osm/`: directory of osm-p2p data. Likely created by [Mapeo Desktop](https://github.com/digidem/mapeo-desktop).
  - `style.json`: a JSON file adhering to the [MapBox Style Specification](https://www.mapbox.com/mapbox-gl-js/style-spec/).
- Generated
  - `geo.json`: GeoJSON export of the osm-p2p database. Produced by running the `export.js` script.
  - `icons.{json,png}`: Icons of SVG presets, converted into a single PNG sprite sheet. The JSON file describes the names & locations in the spritesheet of each icon. Produced by running the `build_sprites.js` script.

If you have such a directory, you can generate the GeoJSON and the PNG icons and
then serve it up as a website as

```
$ node build_sprites.js local_parks/

$ node export.js local_parks/

$ node serve.js local_parks/

Serving on http://localhost:9050/
```

## Conclusions

Once all of these files are present in a directory in the root dir of this
repo, `node serve.js dataset/` will start a local HTTP server, serving an
interactive web map of the OSM data, presets, & icons provided.

This is still very tedious. This work is meant as a proof-of-concept that we can render vector tiles efficiently for osm-p2p data, and as a base for the future work of integrating vector tile rendering into [Mapeo Desktop](https://github.com/digidem/mapeo-desktop).
