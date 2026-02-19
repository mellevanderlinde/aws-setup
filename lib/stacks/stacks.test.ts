import { App, Aspects, DefaultStackSynthesizer } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { RemovalPolicyDestroyAspect } from '../utils/aspects';
import { BudgetStack } from './budget';
import { DriftDetectionStack } from './drift-detection';
import { GarbageCollectionStack } from './garbage-collection';
import { IdentityCenterStack } from './identity-center';

describe('stacks', () => {
  const email = 'email@example.com';

  const defaultStackSynthesizer = new DefaultStackSynthesizer({ generateBootstrapVersionRule: false });
  const app = new App({ defaultStackSynthesizer });
  Aspects.of(app).add(new RemovalPolicyDestroyAspect());

  it.each([
    [
      'budget',
      new BudgetStack(app, 'BudgetStack', { email }),
    ],
    [
      'drift detection',
      new DriftDetectionStack(app, 'DriftDetectionStack', { email }),
    ],
    [
      'garbage collection',
      new GarbageCollectionStack(app, 'GarbageCollectionStack', { email }),
    ],
    [
      'identity center',
      new IdentityCenterStack(app, 'IdentityCenterStack', { instanceArn: 'instanceArn', userId: 'userId' }),
    ],
  ])('%s stack matches snapshot', (_name, stack) => {
    const template = Template.fromStack(stack);

    const functions = template.findResources('AWS::Lambda::Function');
    Object.keys(functions).forEach((key) => {
      functions[key].Properties.Code.S3Key = 'REDACTED';
    });

    expect(template).toMatchSnapshot();
  });
});
