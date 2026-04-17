# /infra/data

`projects.json` is the dataset for the PH Transportation Infrastructure Map.
`schema.json` documents the record shape (JSON Schema draft-07).

## Inclusion Rules

A project belongs in `projects.json` only if at least one is true:

- NEDA Board approved
- NEDA-ICC approved
- Notice of Award issued (for PPPs)
- Construction contract awarded
- Currently under construction
- Partially operational (some segments still under construction)

Excluded: pre-feasibility, unsolicited-but-unapproved, suspended/shelved.

## When updating

- Bump `last_updated` on the modified record.
- Use ISO dates (YYYY-MM-DD).
- `geometry.coordinates` is `[longitude, latitude]` (GeoJSON convention — lon first).
- Sources MUST include URLs.
