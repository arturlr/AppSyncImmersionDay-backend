// Source: https://github.com/aws-samples/aws-appsync-resolver-samples/blob/main/samples/todo-api-cfn

import { util } from '@aws-appsync/utils';

/**
 * Creates a new item in a DynamoDB table
 * @param ctx contextual information about the request
 */
export function request(ctx) {
    const { filter, limit = 20, nextToken } = ctx.args;
    return dynamoDBScanRequest({ filter, limit, nextToken });
}

/**
 * Returns the result
 * @param ctx contextual information about the request
 */
export function response(ctx) {
    const { error, result } = ctx;
    if (error) {
        return util.appendError(error.message, error.type, result);
    }
    
    const { items = [], nextToken } = result;
    return { items, nextToken };
}

/**
 * A helper function to get a list of items
 * @returns a Scan request
 */
function dynamoDBScanRequest({ filter: f, limit, nextToken }) {
    const filter = f ? JSON.parse(util.transform.toDynamoDBFilterExpression(f)) : null;

    return { operation: 'Scan', filter, limit, nextToken };
}
