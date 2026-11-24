# SPEC — news-image-20261123

## Deliverable
A deterministic, offline Node 22 `main.ts` that writes a complete 1024×1024 PNG to `${MAKEFUN_OUTPUT_DIR ?? '/output'}/entry.png`. The repository owns all runtime assets and does not install packages at run time.

## Frozen editorial contract
- The image is a dated Monday 23 November 2026 world-news front page, not a generic news poster.
- Include exactly 36 numbered reports: 3 hero (01–03), 10 illustrated cards (04–13), 23 `ALSO ON` briefs (14–36), with exactly seven-region counts `GLOBAL 1 · EUROPE 10 · MIDDLE EAST 2 · ASIA 6 · AFRICA 5 · AMERICAS 8 · OCEANIA 4`.
- Repeat the story IDs consistently in source data, number rail, illustrations, map pins, and lists. Preserve the six fixed number-to-story links `[30,5,31,26,34,13]`, the six publication-time UTC items in the approved order, and all eight DATE CHECK exclusions.
- Attribute contested/rolling claims and distinguish events from later updates, proposals, and unresolved processes. Every story carries a compact source label; no competitor wording, artwork, screenshots, or binaries are used.
- Composition: masthead/date/deck; UTC filing strip; region strip; three hero cards plus a vertical six-number rail; a 2×5 illustrated-card grid; indexed world map plus two `ALSO ON` columns; a readable two-row DATE CHECK and confidence/source footer.
- Warm newsprint, ink/navy, restrained rust accents; static local Source Serif 4 and Source Sans 3 TTFs; custom original vector illustrations; Natural Earth 110m land geometry.

## Runtime / packaging contract
- No network, current time, unseeded randomness, environment fonts, external files, or install step.
- Render a complete original SVG in code, rasterize using vendored `@resvg/resvg-wasm` 2.6.2 and vendored static fonts/data. Explicitly load font files and disable system-font discovery.
- Exit successfully within 60 seconds; create the configured output directory; emit a whole PNG ≤1 MiB, width and height ≤1024.
- Two fresh executions with identical inputs emit byte-identical PNGs. PNG structure, CRCs and decompressed RGBA scanlines must be valid.

## Tests and visual acceptance
`tests/acceptance.test.mjs` freezes data counts, regions, numeric/story links, UTC filing points, date exclusions, map anchors, PNG dimensions/structure/CRCs/scanlines, output-path behavior, and repeat-run byte identity. Before implementation the output and metadata tests must fail. After each implementation change rerun the acceptance suite and inspect the rendered PNG at 1024, 512, and 256 px; check real TTF glyph bounds/line widths against each text box and visually check overlap, clipping, chart/story indexing and legibility. No kit transcript/entry submission command is run by this builder.
