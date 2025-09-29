import type { StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import { PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { CfnAssignment, CfnPermissionSet } from 'aws-cdk-lib/aws-sso';
import { Region } from '../utils/enums';

export class IdentityCenterStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & { instanceArn: string; userId: string }) {
    super(scope, id, props);

    const developerPermissionSet = new CfnPermissionSet(this, 'DeveloperPermissionSet', {
      instanceArn: props.instanceArn,
      name: 'developer',
      managedPolicies: ['arn:aws:iam::aws:policy/ReadOnlyAccess'],
      inlinePolicy: new PolicyDocument({
        statements: [
          ...this.bootstrapPermissions(Region.EU_WEST_1),
          ...this.bootstrapPermissions(Region.US_EAST_1),
          new PolicyStatement({
            actions: ['sts:AssumeRole'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'iam:ResourceTag/aws-cdk:bootstrap-role': [
                  'image-publishing',
                  'file-publishing',
                  'deploy',
                  'lookup',
                ],
              },
            },
          }),
          new PolicyStatement({
            actions: ['cloudfront:CreateInvalidation'],
            resources: [`arn:aws:cloudfront::${this.account}:distribution/*`],
          }),
          new PolicyStatement({
            actions: ['lambda:InvokeFunction'],
            resources: [`arn:aws:lambda:eu-west-1:${this.account}:function:*`],
          }),
        ],
      }),
      sessionDuration: 'PT12H', // 12 hours
    });

    const administratorPermissionSet = new CfnPermissionSet(this, 'AdministratorPermissionSet', {
      instanceArn: props.instanceArn,
      name: 'administrator',
      managedPolicies: ['arn:aws:iam::aws:policy/ReadOnlyAccess'],
      inlinePolicy: new PolicyDocument({
        statements: [
          new PolicyStatement({
            actions: ['sso:UpdateSSOConfiguration'],
            resources: ['*'],
          }),
        ],
      }),
      sessionDuration: 'PT1H', // 1 hour
    });

    new CfnAssignment(this, 'DeveloperAssignment', {
      instanceArn: props.instanceArn,
      permissionSetArn: developerPermissionSet.attrPermissionSetArn,
      principalId: props.userId,
      principalType: 'USER',
      targetType: 'AWS_ACCOUNT',
      targetId: this.account,
    });

    new CfnAssignment(this, 'AdministratorAssignment', {
      instanceArn: props.instanceArn,
      permissionSetArn: administratorPermissionSet.attrPermissionSetArn,
      principalId: props.userId,
      principalType: 'USER',
      targetType: 'AWS_ACCOUNT',
      targetId: this.account,
    });
  }

  private bootstrapPermissions(region: Region): PolicyStatement[] {
    return [
      new PolicyStatement({
        actions: [
          'cloudformation:CreateChangeSet',
          'cloudformation:DeleteStack',
          'cloudformation:DeleteChangeSet',
          'cloudformation:DescribeChangeSet',
          'cloudformation:DescribeStackEvents',
          'cloudformation:DescribeStacks',
          'cloudformation:ExecuteChangeSet',
          'cloudformation:GetTemplate',
        ],
        resources: [
          `arn:aws:cloudformation:${region}:${this.account}:stack/CDKToolkit/*`,
        ],
      }),
      new PolicyStatement({
        actions: [
          'iam:CreateRole',
          'iam:DeleteRole',
          'iam:GetRole',
          'iam:TagRole',
          'iam:AttachRolePolicy',
          'iam:DetachRolePolicy',
          'iam:DeleteRolePolicy',
          'iam:PutRolePolicy',
          'iam:UpdateAssumeRolePolicy',
        ],
        resources: [
          'arn:aws:iam::*:policy/*',
          `arn:aws:iam::${this.account}:role/cdk-hnb659fds-*`,
        ],
      }),
      new PolicyStatement({
        actions: [
          's3:CreateBucket',
          's3:DeleteBucket',
          's3:PutBucketPolicy',
          's3:DeleteBucketPolicy',
          's3:PutBucketPublicAccessBlock',
          's3:PutBucketVersioning',
          's3:PutEncryptionConfiguration',
          's3:PutLifecycleConfiguration',
        ],
        resources: [
          `arn:aws:s3:::cdk-hnb659fds-assets-${this.account}-${region}`,
        ],
      }),
      new PolicyStatement({
        actions: [
          'ssm:DeleteParameter',
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:PutParameter',
        ],
        resources: [
          `arn:aws:ssm:${region}:${this.account}:parameter/cdk-bootstrap/hnb659fds/version`,
        ],
      }),
      new PolicyStatement({
        actions: [
          'ecr:CreateRepository',
          'ecr:DeleteRepository',
          'ecr:DescribeRepositories',
          'ecr:SetRepositoryPolicy',
          'ecr:PutLifecyclePolicy',
          'ecr:PutImageTagMutability',
        ],
        resources: [
          `arn:aws:ecr:${region}:${this.account}:repository/cdk-hnb659fds-container-assets-${this.account}-${region}`,
        ],
      }),
    ];
  }
}
