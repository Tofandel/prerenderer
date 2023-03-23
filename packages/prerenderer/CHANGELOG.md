# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## 1.1.0 - 2023-03-23

### Changed
- Upgrade typescript to v5
- Bump dependencies
- Allow renderer option to be a string or a constructor
- Add rendererOptions option for the later case
- fix broken mjs support (`.default` was needed when importing)

### Fixes
- Fix warning about `renderAfter*` options being `deprecated` options, which is not the case

## 1.0.3 - 2023-01-21

### Changed
- Monorepo migration
- Typescript migration

### Deprecated
- `server.before` option, use `new Prerenderer(...).hookServer(cb, stage?)` instead

### Security
- Updated all dependencies

## [0.7.2] - 2020-06-28

Prior versions did not keep a changelog
