import { util } from '@aws-appsync/utils';

/**
 * AppSync function: sends a query request
 * Find more samples and templates at https://github.com/aws-samples/aws-appsync-resolver-samples
 */

/**
 * Sends a query request
 * @param ctx the request context
 */
export function request(ctx) {
    const { publisherId, first = 20, after } = ctx.args;
    const index = 'publisher-index';
    return dynamodbGetItemRequest('publisherId', publisherId, index, first, after);
}

/**
 * Returns the result
 * @param ctx the request context
 */
export function response(ctx) {
    const { error, result } = ctx;
    if (error) {
        return util.appendError(error.message, error.type, result);
    }
    return result;
}

/**
 * Helper function to format a DynamoDB query request
 * @param  {string} key key name
 * @param  {any} value key value
 * @param  {string} index name of the index to query
 * @param  {number} limit max number of items to return
 * @param  {string} nextToken? token specifying where the query should start reading from
 * @returns DynamoDBQueryRequest
 */
function dynamodbGetItemRequest(key, value, index, limit, nextToken) {
    const expression = `#key = :key`;
    const expressionNames = { '#key': key };
    const expressionValues = util.dynamodb.toMapValues({ ':key': value });

    return {
        operation: 'Query',
        query: { expression, expressionNames, expressionValues },
        index,
        limit,
        nextToken,
        scanIndexForward: true,
        select: 'ALL_ATTRIBUTES',
    }
}