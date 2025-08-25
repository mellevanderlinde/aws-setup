import type { StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import { CfnBudget } from 'aws-cdk-lib/aws-budgets';

export class BudgetStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & { email: string }) {
    super(scope, id, props);

    const createNotification = (threshold: number): CfnBudget.NotificationWithSubscribersProperty => ({
      notification: {
        comparisonOperator: 'GREATER_THAN',
        threshold,
        notificationType: 'ACTUAL',
      },
      subscribers: [{ address: props.email, subscriptionType: 'EMAIL' }],
    });

    new CfnBudget(this, 'Budget', {
      budget: {
        budgetName: 'Monthly Budget',
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: { amount: 2, unit: 'USD' },
      },
      notificationsWithSubscribers: [
        createNotification(50),
        createNotification(100),
        createNotification(1000),
      ],
    });
  }
}
