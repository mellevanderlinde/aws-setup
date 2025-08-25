import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { beforeEach, describe, it } from 'vitest';
import { RemovalPolicyDestroyAspect } from '../../lib/utils/aspects';

describe('removalPolicyDestroyAspect', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'Stack');
    new Table(stack, 'Table', { partitionKey: { name: 'id', type: AttributeType.STRING } });
  });

  it('has no destroy removal policy by default', () => {
    Template.fromStack(stack).hasResource('AWS::DynamoDB::Table', {
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
    });
  });

  it('has a destroy removal policy when specified', () => {
    Aspects.of(app).add(new RemovalPolicyDestroyAspect());
    Template.fromStack(stack).hasResource('AWS::DynamoDB::Table', {
      DeletionPolicy: 'Delete',
      UpdateReplacePolicy: 'Delete',
    });
  });
});
