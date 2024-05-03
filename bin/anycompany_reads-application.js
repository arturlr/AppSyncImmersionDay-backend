#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { AnyCompanyReadsBackendStack } = require('../lib/anycompany_reads-backend-stack');
const { AnyCompanyReadsFrontendStack } = require('../lib/anycompany_reads-frontend-stack');

const app = new cdk.App();
const backend = new AnyCompanyReadsBackendStack(app, 'AnyCompanyReadsBackendStack', {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

const frontend = new AnyCompanyReadsFrontendStack(app, 'AnyCompanyReadsFrontendStack', {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});