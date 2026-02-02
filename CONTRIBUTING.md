# Contributing to WashWise

First off, thank you for considering contributing to WashWise! 🎉

This document provides guidelines and instructions for contributing to make the process smooth and
effective for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it is governed by our
[Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- **Node.js** >= 22.0.0
- **pnpm** >= 9.15.0
- **Docker** and **Docker Compose** (for local services)
- **Git** >= 2.40

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/washwise.git
   cd washwise
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/washwise/washwise.git
   ```

## Development Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your local configuration.

3. **Start development services:**

   ```bash
   docker-compose up -d postgres redis
   ```

4. **Set up the database:**

   ```bash
   pnpm run db:push
   pnpm run db:seed
   ```

5. **Start the development servers:**
   ```bash
   pnpm run dev
   ```

## Making Changes

### Branch Naming

Use descriptive branch names following this convention:

- `feat/short-description` - New features
- `fix/short-description` - Bug fixes
- `docs/short-description` - Documentation changes
- `refactor/short-description` - Code refactoring
- `test/short-description` - Test additions/changes
- `chore/short-description` - Maintenance tasks

### Before You Start

1. **Sync with upstream:**

   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a new branch:**
   ```bash
   git checkout -b feat/your-feature-name
   ```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                                       |
| ---------- | ------------------------------------------------- |
| `feat`     | A new feature                                     |
| `fix`      | A bug fix                                         |
| `docs`     | Documentation only changes                        |
| `style`    | Code style changes (formatting, semicolons, etc.) |
| `refactor` | Code refactoring                                  |
| `perf`     | Performance improvements                          |
| `test`     | Adding or updating tests                          |
| `build`    | Build system or dependencies                      |
| `ci`       | CI/CD changes                                     |
| `chore`    | Other changes that don't modify src or test files |
| `revert`   | Reverts a previous commit                         |

### Scopes

- `api-server` - Backend API changes
- `web-admin` - Admin dashboard changes
- `database` - Database/Prisma changes
- `types` - Type definitions
- `config` - Configuration package
- `e2e` - E2E tests
- `docs` - Documentation
- `ci` - CI/CD configuration
- `deps` - Dependency updates

### Examples

```bash
# Feature
git commit -m "feat(web-admin): add machine status filter component"

# Bug fix
git commit -m "fix(api-server): resolve authentication token refresh issue"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking change
git commit -m "feat(api-server)!: change machine status enum values

BREAKING CHANGE: MachineStatus values have been renamed for clarity"
```

## Pull Request Process

1. **Update your branch:**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks locally:**

   ```bash
   pnpm run lint
   pnpm run build
   pnpm run test
   ```

3. **Push your branch:**

   ```bash
   git push origin feat/your-feature-name
   ```

4. **Create a Pull Request:**
   - Use the PR template
   - Link related issues
   - Add appropriate labels
   - Request reviews from maintainers

5. **Address Review Feedback:**
   - Make requested changes
   - Push new commits (don't force-push during review)
   - Re-request review when ready

## Code Style

### TypeScript

- Use strict TypeScript configuration
- Prefer `type` imports for type-only imports
- Use explicit return types for public functions
- Avoid `any` - use `unknown` or proper types

### React/Next.js

- Use functional components with hooks
- Follow the App Router patterns
- Use server components where possible
- Implement proper loading and error states

### Backend (Fastify)

- Use async/await consistently
- Validate all inputs with Zod
- Include proper error handling
- Log important operations

### General

- Write self-documenting code
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Follow DRY and SOLID principles

## Testing

### Running Tests

```bash
# Unit tests
pnpm run test

# Integration tests
pnpm run test:integration

# E2E tests
pnpm --filter @washwise/e2e test

# With coverage
pnpm run test -- --coverage
```

### Writing Tests

- Write tests for all new features
- Maintain test coverage above 80%
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for new public APIs
- Update API documentation for endpoint changes
- Include inline comments for complex logic

---

## Questions?

Feel free to:

- Open a [Discussion](https://github.com/washwise/washwise/discussions)
- Ask in our [Discord](https://discord.gg/washwise)
- Email us at team@washwise.io

Thank you for contributing! 🙏
