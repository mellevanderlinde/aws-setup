import { App, Aspects, DefaultStackSynthesizer } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { beforeEach, describe, expect, it } from 'vitest';
import { RemovalPolicyDestroyAspect } from '../utils/aspects';
import { BudgetStack } from './budget';
import { DriftDetectionStack } from './drift-detection';
import { GarbageCollectionStack } from './garbage-collection';
import { IdentityCenterStack } from './identity-center';

describe('stacks', () => {
  const email = 'email@example.com';
  let app: App;

  beforeEach(() => {
    app = new App({
      defaultStackSynthesizer: new DefaultStackSynthesizer({ generateBootstrapVersionRule: false }),
    });
    Aspects.of(app).add(new RemovalPolicyDestroyAspect());
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
