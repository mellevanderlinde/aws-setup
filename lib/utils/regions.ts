export const regions = ['eu-west-1', 'us-east-1'] as const

export type Region = (typeof regions)[number]
