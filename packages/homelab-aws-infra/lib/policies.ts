import { Policy, PolicyDocument, PolicyStatement, Effect } from "aws-cdk-lib/aws-iam"


export const getPolicies = (s: any) => {
    return {
        traefik: getTraefikPolicy(s),
        grafana: getGrafanaPolicy(s),

    }
}


function getTraefikPolicy(s: any) {
    return new Policy(s, "Route53DNSChallengePolicy", {
        document: new PolicyDocument({
            statements: [
                new PolicyStatement({
                    actions: [
                        'route53:GetChange'
                    ],
                    resources: ['arn:aws:route53:::change/*'],
                    effect: Effect.ALLOW
                }),
                new PolicyStatement({
                    actions: [
                        'route53:ListHostedZonesByName'
                    ],
                    resources: ['*'],
                    effect: Effect.ALLOW
                }),
                new PolicyStatement({
                    actions: [
                        'route53:ListResourceRecordSets'
                    ],
                    resources: ['arn:aws:route53:::hostedzone/ZSXXJQ44AUHG2'],
                    effect: Effect.ALLOW
                }),
                new PolicyStatement({
                    actions: [
                        'route53:ChangeResourceRecordSets'
                    ],
                    resources: ['arn:aws:route53:::hostedzone/ZSXXJQ44AUHG2'],
                    effect: Effect.ALLOW,
                    // conditions: {
                    //     "ForAllValues:StringEquals": {
                    //         "route53:ChangeResourceRecordSetsNormalizedRecordNames": [
                    //             "_acme-challenge.parkergiven.com"
                    //         ],
                    //         "route53:ChangeResourceRecordSetsRecordTypes": [
                    //             "TXT"
                    //         ]
                    //     }
                    // }
                })
            ]
        })
    })
}
function getGrafanaPolicy(s: any) {
    const policyDocument = new PolicyDocument({
        statements: [
            new PolicyStatement({
                sid: 'AllowReadingMetricsFromCloudWatch',
                effect: Effect.ALLOW,
                actions: [
                    'cloudwatch:DescribeAlarmsForMetric',
                    'cloudwatch:DescribeAlarmHistory',
                    'cloudwatch:DescribeAlarms',
                    'cloudwatch:ListMetrics',
                    'cloudwatch:GetMetricData',
                    'cloudwatch:GetInsightRuleReport',
                ],
                resources: ['*'],
            }),
            new PolicyStatement({
                sid: 'AllowReadingLogsFromCloudWatch',
                effect: Effect.ALLOW,
                actions: [
                    'logs:DescribeLogGroups',
                    'logs:GetLogGroupFields',
                    'logs:StartQuery',
                    'logs:StopQuery',
                    'logs:GetQueryResults',
                    'logs:GetLogEvents',
                ],
                resources: ['*'],
            }),
            new PolicyStatement({
                sid: 'AllowReadingTagsInstancesRegionsFromEC2',
                effect: Effect.ALLOW,
                actions: ['ec2:DescribeTags', 'ec2:DescribeInstances', 'ec2:DescribeRegions'],
                resources: ['*'],
            }),
            new PolicyStatement({
                sid: 'AllowReadingResourcesForTags',
                effect: Effect.ALLOW,
                actions: ['tag:GetResources'],
                resources: ['*'],
            }),
        ],
    });

    const policy = new Policy(s, 'GrafanaMetricsandLogsRead', {
        policyName: 'GrafanaMetricsandLogsRead',
        document: policyDocument,
    });

    return policy
}

