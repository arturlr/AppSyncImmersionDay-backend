#!/bin/bash

cd ~/environment/AnyCompanyReads-backend
API_URL=`jq -r .AnyCompanyReadsBackendStack.GraphQLAPIURL output.json`

CLIENT_ID=`jq -r .AnyCompanyReadsBackendStack.USERPOOLSWEBCLIENTID output.json`
AUTH_TOKEN=$(sed -e 's/^"//' -e 's/"$//' <<< $(aws cognito-idp initiate-auth \
  --client-id $CLIENT_ID \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=tester,PASSWORD=TempPassword1234! \
  | jq '.AuthenticationResult.AccessToken'))

CREATE_BOOK_VAR='{"input":{"authorId":"123","genres":["Children", "Family"],"publisherId":"456","title":"The Many Adventure of Winnie the Pooh"}}'
LIST_BY_GENRE_VAR='{"genre":"Children"}'

CREATE_BOOK='mutation CreateBook1($input: CreateBookInput!) { createBook(input: $input) { id title genres } }'
LIST_BOOKS='query ListBooksByGenre($genre: String!) { listBooksByGenre(genre: $genre) { items { id title genres } } }'

if [ $1 == "create" ]; then
    curl -s XPOST -H "Content-Type:application/graphql" \
        -H "Authorization:$AUTH_TOKEN" \
        -d '{"query": "'"$CREATE_BOOK"'","variables": '"$CREATE_BOOK_VAR"'}' $API_URL | jq

elif [ $1 == "list_genre" ]; then
    echo "Listing all books with genre: Children"
    curl -s XPOST -H "Content-Type:application/graphql" \
        -H "Authorization:$AUTH_TOKEN" \
        -d '{"query": "'"$LIST_BOOKS"'","variables": '"$LIST_BY_GENRE_VAR"'}' $API_URL | jq

elif [ $1 == "delete" ]; then
    LIST_BOOKS='query ListBooksByGenre($genre: String!) { listBooksByGenre(genre: $genre) { items { id title } } }'
    LIST_BY_GENRE_VAR='{"genre":"Children"}'

    ID_VALS=$(curl -s XPOST -H "Content-Type:application/graphql" \
    -H "Authorization:$AUTH_TOKEN" \
    -d '{"query": "'"$LIST_BOOKS"'","variables": '"$LIST_BY_GENRE_VAR"'}' $API_URL | jq .data.listBooksByGenre.items[].id)

    # Delete books
    DELETE_BOOK='mutation DeleteBook($input: DeleteBookInput!) { deleteBook(input: $input) { id } }'

    for id in $ID_VALS
    do
        VAR='{"input":{"id":'$id'}}'
        curl -s XPOST -H "Content-Type:application/graphql" \
            -H "Authorization:$AUTH_TOKEN" \
            -d '{"query": "'"$DELETE_BOOK"'","variables": '"$VAR"'}' $API_URL | jq
    done

    # Verify everything was deleted
    curl -s XPOST -H "Content-Type:application/graphql" \
        -H "Authorization:$AUTH_TOKEN" \
        -d '{"query": "'"$LIST_BOOKS"'","variables": '"$LIST_BY_GENRE_VAR"'}' $API_URL | jq
else
    echo "==== Invalid command line argument ===="
fi