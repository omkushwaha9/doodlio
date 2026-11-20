
# Development Guide

## Requirements

- Node.js >= 22.12.0
- npm >= 11
- Git
- A code editor such as VS Code

## Clone the Repository

```bash
git clone https://github.com/omkushwaha9/doodlio.git
cd doodlio
```

## Install Dependencies

```bash
npm install
```

## Run the Development Server

```bash
npm run dev
```

## Run the Production Build

```bash
npm run build
```

## Start the Production Server

```bash
npm start
```

## Run Tests

```bash
npm test
```

## Run TypeScript Checks

```bash
npm run lint
```

## Development Workflow

1. Pull the latest repository changes.
2. Install dependencies if package files have changed.
3. Make changes in the relevant source files.
4. Run the test suite.
5. Run TypeScript checks.
6. Build the application.
7. Test the affected functionality locally.
8. Commit and push the changes.

## Before Submitting Changes

Make sure the following commands pass:

```bash
npm run lint
npm test
npm run build
```

## Troubleshooting

### Dependency Issues

Try reinstalling dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use

Check whether another process is already using port 3000 before starting another server instance.

### Production Build Issues

Run the following commands to identify TypeScript and build errors:

```bash
npm run lint
npm run build
```
