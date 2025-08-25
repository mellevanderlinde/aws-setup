import { App, DefaultStackSynthesizer } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { beforeEach, describe, expect, it } from 'vitest';
import { BudgetStack } from '../../lib/stacks/budget';
import { DriftDetectionStack } from '../../lib/stacks/drift-detection';
import { GarbageCollectionStack } from '../../lib/stacks/garbage-collection';
import { IdentityCenterStack } from '../../lib/stacks/identity-center';

describe('aws config', () => {
  const email = 'email@example.com';
  let app: App;

  beforeEach(() => {
    app = new App({
      defaultStackSynthesizer: new DefaultStackSynthesizer({ generateBootstrapVersionRule: false }),
    });
  });

  it('garbage collection stack matches snapshot', () => {
    const stack = new GarbageCollectionStack(app, 'GarbageCollectionStack', { email });
    const template = Template.fromStack(stack);
    expect(template).toMatchSnapshot();
  });

  it('identity center stack matches snapshot', () => {
    const stack = new IdentityCenterStack(app, 'IdentityCenterStack', {
      instanceArn: 'instanceArn',
      userId: 'userId',
    });
    const template = Template.fromStack(stack);
    expect(template).toMatchSnapshot();
  });

  it('budget stack matches snapshot', () => {
    const stack = new BudgetStack(app, 'BudgetStack', { email });
    const template = Template.fromStack(stack);
    expect(template).toMatchSnapshot();
  });

  it('drift detection stack matches snapshot', () => {
    const stack = new DriftDetectionStack(app, 'DriftDetectionStack', { email });
    const template = Template.fromStack(stack);
    expect(template).toMatchSnapshot();
  });
});
