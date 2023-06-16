# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### [5.3.5] - 2023-06-16
- Fix fallback double rendering if multiple html-webpack-plugin

### [5.3.3] - 2023-05-19
- Fix handling of a custom webpack `publicPath` in the express server

### [5.3.0] - 2023-05-19
- Added `fallback` option to generate a non prerendered `index_fallback.html`

### [5.2.0] - 2023-03-28
- Move the postProcess option from the plugin to the `Prerenderer`

## [5.1.1] - 2023-03-27
- Fix missing `index.mjs` and `types` in the package.json `file` field

## [5.1.0] - 2023-03-23

### Changed
- Upgrade typescript to v5
- fix broken mjs support (`.default` was needed when importing)

## [5.0.3] - 2023-01-21

### Initial release within the monorepo repository
