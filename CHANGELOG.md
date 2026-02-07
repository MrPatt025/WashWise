## [1.1.10](https://github.com/washwise/washwise/compare/v1.1.9...v1.1.10) (2026-02-07)

### Bug Fixes

- **api-server:** align integration test types with prisma schema
  ([daca13e](https://github.com/washwise/washwise/commit/daca13e79bfe2f034e383f56c4650f68e4be487d))

## [1.1.9](https://github.com/washwise/washwise/compare/v1.1.8...v1.1.9) (2026-02-07)

### Bug Fixes

- **api-server:** clean up debug logging in integration test
  ([bd2c330](https://github.com/washwise/washwise/commit/bd2c330255c4a604f61d05280ec457c3b5aa682b))

## [1.1.8](https://github.com/washwise/washwise/compare/v1.1.7...v1.1.8) (2026-02-07)

### Bug Fixes

- **api-server:** use pg adapter for PrismaClient in integration tests
  ([8a1ccf7](https://github.com/washwise/washwise/commit/8a1ccf7144d282a8618611733acb1f62671910f2))

## [1.1.7](https://github.com/washwise/washwise/compare/v1.1.6...v1.1.7) (2026-02-07)

### Bug Fixes

- **api-server:** remove deprecated datasources from PrismaClient constructor
  ([24f8cda](https://github.com/washwise/washwise/commit/24f8cdaaa5542dcb69294ab6b3e5a426b92054fd))

## [1.1.6](https://github.com/washwise/washwise/compare/v1.1.5...v1.1.6) (2026-02-07)

### Bug Fixes

- **database:** add datasource url to schema for prisma db push compatibility
  ([4b16235](https://github.com/washwise/washwise/commit/4b1623580de8de731f7e543edcba8d8d94dbce11))
- **database:** revert url from schema.prisma, use cwd for prisma db push
  ([44b5f82](https://github.com/washwise/washwise/commit/44b5f827a665a08360b9082a84e693eae3a85f5f))
