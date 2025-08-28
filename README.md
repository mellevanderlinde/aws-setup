# AWS Account Setup

This repository contains stacks to setup my AWS account. This includes:

- Cost budget, which notifies when a threshold is exceeded.
- Identity Center, which sets up a permission set with developer access.
- Garbage collection, which periodically removes old CDK assets.
- Drift detection, which periodically detects if CloudFormation stacks have drifted from its expected template.

## Setup

1. Run `cp .env.template .env`.
2. Fill in the specific values in the created `.env` file.

## Commands

To install the project's dependencies and run the CI steps, run:

```
pnpm install
pnpm run ci
```

To deploy the stacks:

```
cdk deploy
```

To bootstrap the account:

```
pnpm run bootstrap
```
