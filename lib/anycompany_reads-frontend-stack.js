const cdk = require('aws-cdk-lib');
const cr = require('aws-cdk-lib/custom-resources');
const { Repository } = require('aws-cdk-lib/aws-codecommit');
const {
    Role,
    ServicePrincipal,
    ManagedPolicy
} = require('aws-cdk-lib/aws-iam');
const {
    App,
    Branch,
    CodeCommitSourceCodeProvider,
    RedirectStatus,
    GitHubSourceCodeProvider
} = require('@aws-cdk/aws-amplify-alpha');

class AnyCompanyReadsFrontendStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);

        // Define service role for AWS Amplify
        const serviceRole = new Role(this, 'AmplifyServiceRole', {
            assumedBy: new ServicePrincipal('amplify.amazonaws.com'),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess-Amplify'),
            ],
        });

        // Reference existing AWS CodeCommit repository for frontend code
        // const repo = Repository.fromRepositoryName(this, "Frontend-repo", "AnyCompanyReads-frontend");

        // Define Amplify app with CodeCommit provider
        const app = new App(this, 'AppSyncImmersionDay-frontend', {
            appName: "AppSyncImmersionDay-frontend",
            role: serviceRole,
            customRules: [{
                source: "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>",
                target: '/index.html',
                status: RedirectStatus.REWRITE
            }],
            sourceCodeProvider: new GitHubSourceCodeProvider({
                owner: 'arturlr',
                repository: 'AppSyncImmersionDay-Frontend',
              }),
              autoBranchCreation: { // Automatically connect branches that match a pattern set
                patterns: ['main/*', 'master/*'],
              },
              autoBranchDeletion: true, // Automatically disconnect a branch when you delete a branch from your repository
        });

        // Define Amplify app with CodeCommit provider
        // const app = new App(this, 'AnyCompanyReads-frontend', {
        //     appName: "AnyCompanyReads-frontend",
        //     role: serviceRole,
        //     sourceCodeProvider: new CodeCommitSourceCodeProvider({
        //         repository: repo
        //     }),
        //     customRules: [{
        //         source: "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>",
        //         target: '/index.html',
        //         status: RedirectStatus.REWRITE
        //     }]
        // });

        // Create a new environment from the associated branch
        const mainEnv = new Branch(this, 'main', { app });

        // Create a custom resource for automatically starting a build
        new cr.AwsCustomResource(this, 'StartAmplifyBuild', {
            onCreate: {
                service: 'Amplify',
                action: 'startJob',
                physicalResourceId: cr.PhysicalResourceId.of('amplify-build-trigger'),
                parameters: {
                    appId: app.appId,
                    branchName: mainEnv.branchName,
                    jobType: 'RELEASE',
                    jobReason: 'Initial build deployment after stack creation.'
                }
            },
            policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
                resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE
            })
        });

        new cdk.CfnOutput(this, 'AmplifyApp-Url', { value: `${mainEnv.branchName}.${app.defaultDomain}` });
        new cdk.CfnOutput(this, 'AmplifyApp-ID', { value: app.appId });
        new cdk.CfnOutput(this, 'AmplifyApp-Branch', { value: mainEnv.branchName });

    }
}

module.exports = { AnyCompanyReadsFrontendStack };
