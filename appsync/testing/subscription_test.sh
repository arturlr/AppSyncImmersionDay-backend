#!/bin/bash

cd ~/environment/AnyCompanyReads-backend
BOOK1_VAR='{"input":{"id":"123","authorId":"123","publicationYear":"1990","publisherId":"456","title":"The Many Adventure of Winnie the Pooh"}}'
CREATE_BOOK='mutation CreateBook1($input: CreateBookInput!) { createBook(input: $input) { id title } }'

DELBOOK1_VAR='{"input":{"id":"123"}}'
DELETE_BOOK='mutation DeleteBook($input: DeleteBookInput!) { deleteBook(input: $input) { id title } }'

API_URL=`jq -r .AnyCompanyReadsBackendStack.GraphQLAPIURL output.json`
CLIENT_ID=`jq -r .AnyCompanyReadsBackendStack.USERPOOLSWEBCLIENTID output.json`
AUTH_TOKEN_STR=$(aws cognito-idp initiate-auth \
    --client-id $CLIENT_ID \
    --auth-flow USER_PASSWORD_AUTH \
    --auth-parameters USERNAME=tester,PASSWORD=TempPassword1234! \
    | jq '.AuthenticationResult.AccessToken')
AUTH_TOKEN=$(sed -e 's/^"//' -e 's/"$//' <<< $AUTH_TOKEN_STR)

if [ $1 == "create" ]; then
    curl -s XPOST -H "Content-Type:application/graphql" \
        -H "Authorization:$AUTH_TOKEN" \
        -d '{"query": "'"$CREATE_BOOK"'","variables": '"$BOOK1_VAR"'}' $API_URL | jq

elif [ $1 == "delete" ]; then
    curl -s XPOST -H "Content-Type:application/graphql" \
        -H "Authorization:$AUTH_TOKEN" \
        -d '{"query": "'"$DELETE_BOOK"'","variables": '"$DELBOOK1_VAR"'}' $API_URL | jq

else
    echo "==== Invalid command line argument ===="
fi