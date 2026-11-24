# Local asset sources

- `vendor/resvg/`: `@resvg/resvg-wasm` 2.6.2. The package's WebAssembly engine is run entirely offline and is explicitly initialized from `index_bg.wasm`.
- `vendor/node_modules/`: `d3-geo` 3.1.1, `topojson-client` 3.1.0, and `d3-array` 3.2.4, kept as compact locally imported distributions with their original license notices.
- `assets/geography/natural-earth-110m/land-110m.json`: Natural Earth 1:110m land layer (4.1.0), distributed by `world-atlas` 2.0.2. The retained upstream README and license identify the data and redistribution terms.
- `assets/fonts/`: four static Latin TTF faces of Source Serif 4 and Source Sans 3. Their OFL notices are retained next to the fonts. They are embedded as font buffers; system font loading is disabled.

All asset bytes are committed in this repository. No code or visual asset from a competing entry is included.
