# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2023-03-23

### Changed
- Upgrade typescript to v5
- fix broken mjs support (`.default` was needed when importing)
- `renderAfterTime`, `renderAfterElementExists` and `renderAfterEvent` can now run in parallel, the first to resolve will render the page

## [1.0.3] - 2023-01-21

### Changed
- Monorepo migration
- Typescript migration
- Use the newer JSDOM api

### Added
- Fetch implementation

### Security
- Updated all dependencies

## [0.2.0] - 2020-06-28

Prior versions did not keep a changelog
