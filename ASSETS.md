# Asset provenance and licenses

| Asset | Version / source | License and use |
|---|---|---|
| SVG rasterizer | `@resvg/resvg-wasm` 2.6.2, npm package; shipped locally in `vendor/resvg/` | MPL-2.0; original notice/license in `vendor/resvg/LICENSE.txt` |
| Projection and topology client | `d3-geo` 3.1.1; `topojson-client` 3.1.0; `d3-array` 3.2.4; `internmap` 2.0.3 | ISC; each upstream package notice is retained beside its files in `vendor/node_modules/` |
| Land geometry | Natural Earth 1:110m land, dataset 4.1.0 redistributed as `world-atlas` 2.0.2 `land-110m.json` | Natural Earth data is public domain; upstream redistribution notice and license are retained in `assets/geography/natural-earth-110m/` |
| Source Serif 4 Bold and Source Sans 3 Regular, Semibold and Bold | Static Latin WOFF faces from `@fontsource/source-serif-4` 5.3.1 and `@fontsource/source-sans-3` 5.3.1, converted to static TTF with FontTools 4.46.0. Semibold naming/weight metadata was normalized to the family and 600 weight for deterministic font selection. | SIL Open Font License 1.1; original notices are in each font family directory |

The SVG layout, custom icon art, story copy, font-metric reader, wrapping/layout code and output pipeline are original project code. Runtime dependencies are read from the repository only; no package manager or network is used by `main.ts`.
