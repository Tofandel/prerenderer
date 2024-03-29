# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.3] - 2024-01-12
- Fix typescript export issue in package.json
- Upgrade deps
- Add missing ts-deepmerge dependency and remove unused deepmerge dependency

## [1.2.0] - 2023-05-34
- Switch to new puppeteer headless mode

## [1.1.5] - 2023-05-24
- Rollback to old puppeteer headless ~~because it's still quirky~~

## [1.1.1] - 2023-03-27
- Fix missing `index.mjs` in the package.json `file` field

## [1.1.0] - 2023-03-23

### Changed
- Upgrade typescript to v5
- fix broken mjs support (`.default` was needed when importing)
- `renderAfterTime`, `renderAfterElementExists` and `renderAfterEvent` can now run in parallel, the first to resolve will render the page

### Added
- `elementVisible` and `elementHidden` options to be used with `renderAfterElementExists` to make sure the element is either hidden or visible

## 1.0.3 - 2023-01-21

### Changed
- Monorepo migration
- Typescript migration
- Moved puppeteer to peerDependencies
- Fixed the timeout option which was documented but not implemented

### Deprecated
- additional root options for puppeteer.launch, use `launchOptions` instead

### Removed
- additional root options for page.goto, use `navigationOptions` instead

### Added
- option `pageSetup` to add custom request interceptors to puppeteer
- option `pageHandler` to execute custom puppeteer commands before rendering the page

### Security
- Updated all dependencies

## [0.2.0] - 2020-06-28

Prior versions did not keep a changelog
