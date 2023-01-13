# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
