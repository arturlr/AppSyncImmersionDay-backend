import { util } from '@aws-appsync/utils';

/**
 * AppSync function: fetches an item from a DynamoDB table.
 * Find more samples and templates at https://github.com/aws-samples/aws-appsync-resolver-samples
 */

/**
 * Request a single item from the attached DynamoDB table datasource
 * @param ctx the request context
 */
export function request(ctx) {
    const { id } = ctx.args;
    return dynamodbGetItemRequest({ id });
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
 * A helper function to get a DynamoDB item
 * @param key a set of keys for the item
 * @returns DynamoDBGetItem
 */
function dynamodbGetItemRequest(key) {
    return {
        operation: 'GetItem',
        key: util.dynamodb.toMapValues(key),
    }
}