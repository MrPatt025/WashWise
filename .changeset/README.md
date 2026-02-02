# Changesets

Welcome to the WashWise monorepo! This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs.

## Adding a Changeset

When you make changes that should be released, run:

```bash
pnpm changeset
```

This will guide you through:
1. Selecting which packages have changed
2. Choosing the type of change (major, minor, patch)
3. Writing a summary of the changes

## Types of Changes

- **major**: Breaking changes (incompatible API changes)
- **minor**: New features (backwards compatible)
- **patch**: Bug fixes (backwards compatible)

## Example Workflow

1. Make your code changes
2. Run `pnpm changeset` to create a changeset file
3. Commit both your changes and the changeset file
4. Create a PR
5. When merged, the release workflow will automatically:
   - Update versions
   - Update changelogs
   - Create GitHub releases

## Changeset File Format

Changeset files are stored in `.changeset/` and look like:

```markdown
---
"@washwise/api-server": minor
"@washwise/web-admin": patch
---

Added new machine status endpoint and updated dashboard
```

## Release Process

The release process is automated via GitHub Actions:

1. **PR Stage**: Changesets are accumulated
2. **Merge to main**: Release PR is automatically created
3. **Merge Release PR**: Packages are published and GitHub releases are created

## Best Practices

- Create one changeset per logical change
- Write clear, user-facing descriptions
- Reference issue numbers when applicable
- Use conventional commit messages for the changeset commit
