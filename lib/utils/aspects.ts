import type { IAspect } from 'aws-cdk-lib';
import type { IConstruct } from 'constructs';
import { CfnResource, RemovalPolicy } from 'aws-cdk-lib';

export class RemovalPolicyDestroyAspect implements IAspect {
  visit(node: IConstruct): void {
    if (CfnResource.isCfnResource(node)) {
      node.applyRemovalPolicy(RemovalPolicy.DESTROY);
    }
  }
}
