import { util } from '@aws-appsync/utils';

/**
 * AppSync function: deletes an item from a DynamoDB table.
 * Find more samples and templates at https://github.com/aws-samples/aws-appsync-resolver-samples
 */

/**
 * Deletes an item from a DynamoDB table.
 * @param ctx the request context
 */
export function request(ctx) {
    const { id } = ctx.args.input;
    return dynamodbDeleteRequest({ id });
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

function dynamodbDeleteRequest(key) {
    return {
        operation: 'DeleteItem',
        key: util.dynamodb.toMapValues(key),
    }
}