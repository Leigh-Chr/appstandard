# Contribution Guide

Thank you for your interest in contributing to AppStandard! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Environment Setup](#environment-setup)
- [Development Standards](#development-standards)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Proposing Features](#proposing-features)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## How to Contribute

### Types of Contributions

- 🐛 **Bug fixes** - Fix an existing issue
- ✨ **New features** - Add a new feature
- 📚 **Documentation** - Improve or add documentation
- 🧪 **Tests** - Add or improve tests
- 🔧 **Maintenance** - Dependency updates, refactoring

### Before Starting

1. Check that there isn't already an issue or PR for your contribution
2. For major changes, open an issue first to discuss
3. Consult the [README](README.md) and [ARCHITECTURE.md](ARCHITECTURE.md) to understand the project

## Environment Setup

### Prerequisites

- [Bun](https://bun.sh) version 1.3.1 or higher
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd appstandard

# Install dependencies
bun install

# Configure the database
bun run db:push

# Launch in development mode
bun run dev
```

## Development Standards

### Code Style

This project uses [Biome](https://biomejs.dev/) for linting and formatting. Code is automatically formatted on each commit via Husky.

```bash
# Check and fix style
bun run check
```

### Naming Conventions

- **Files**: `kebab-case.ts`, React components: `PascalCase.tsx`
- **Variables/Functions**: `camelCase`
- **Types/Interfaces**: `PascalCase`
- **Constants**: `SCREAMING_SNAKE_CASE`

### Commits

```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
```

### Tests

```bash
# Run tests
cd apps/calendar-web && bun run test
```

## Pull Request Process

### 1. Create a Branch

```bash
git checkout -b feat/my-new-feature
# or
git checkout -b fix/bug-fix
```

### 2. Develop

- Make atomic and well-described commits
- Ensure the code compiles: `bun run check-types`
- Check style: `bun run check`

### 3. Create the PR

1. Push your branch to GitHub
2. Create a Pull Request to `master`
3. Fill out the PR template
4. Wait for review

### 4. Review

- Respond to review comments
- Make requested changes
- Once approved, the PR will be merged

### Pre-PR Checklist

- [ ] Code compiles without errors (`bun run check-types`)
- [ ] Linting passes (`bun run check`)
- [ ] Tests pass (if applicable)
- [ ] Documentation is up to date (if API changes)
- [ ] Commit message is descriptive

## Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) to report a bug.

Include:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, browser, Bun version)
- Screenshots if relevant

## Proposing Features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) to propose a feature.

Include:
- A clear description of the feature
- The problem it solves
- Usage examples
- Alternatives considered

## Questions?

If you have questions, open an issue with the `question` label.

---

Thank you for contributing to AppStandard!

