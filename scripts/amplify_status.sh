#!/bin/bash
cd ~/environment/AnyCompanyReads-backend
APP_URL=`jq -r .AnyCompanyReadsFrontendStack.AmplifyAppUrl ./frontend-output.json`
APP_ID=`jq -r .AnyCompanyReadsFrontendStack.AmplifyAppID ./frontend-output.json`
BRANCH_NAME=`jq -r .AnyCompanyReadsFrontendStack.AmplifyAppBranch ./frontend-output.json`
STATUS=$(aws amplify list-jobs --app-id $APP_ID --branch-name $BRANCH_NAME --query "jobSummaries[0].status")
STATUS=$(sed -e 's/^"//' -e 's/"$//' <<< $STATUS)

while [ $STATUS != "SUCCEED" ]
do
    echo 'Waiting for AnyCompany Reads frontend application to fully deploy. This can take around 5 minutes, polling every 30 seconds' >&2
    sleep 30
    STATUS=$(aws amplify list-jobs --app-id $APP_ID --branch-name $BRANCH_NAME --query "jobSummaries[0].status")
    STATUS=$(sed -e 's/^"//' -e 's/"$//' <<< $STATUS)
done

echo -e '\n\nApplication deployed!\n\n' >&2
echo "Navigate to the AnyCompany Reads URL to view your changes: https://$APP_URL" >&2