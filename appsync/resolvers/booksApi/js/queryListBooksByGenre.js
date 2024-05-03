import { util } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';

/**
 * AppSync function: executes a `scan` on a DynamoDB table
 * Find more samples and templates at https://github.com/aws-samples/aws-appsync-resolver-samples
 */

/**
 * Fetches items in a DynamoDB table by performing a scan
 * @param ctx the request context
 */
export function request(ctx) {
    const { genre, limit = 20, nextToken } = ctx.args;
    const filter = { "genres": { "contains": genre } };
    return ddb.scan({ limit, filter, nextToken });
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
    const { items = [], nextToken } = result;
    return { items, nextToken };
}
