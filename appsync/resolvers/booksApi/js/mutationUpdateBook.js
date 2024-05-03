import { util } from '@aws-appsync/utils';

/**
 * AppSync function: updates an item in a DynamoDB table.
 * Find more samples and templates at https://github.com/aws-samples/aws-appsync-resolver-samples
 */

/**
 * Updates an item in a DynamoDB table, if an item with the given key exists.
 * @param ctx the request context
 */
export function request(ctx) {
    const { args: { input: { id, ...values } } } = ctx;

    const key = { id };
    const condition = {};
    for (const k in key) {
        condition[k] = { attributeExists: true };
    }
    return dynamodbUpdateRequest({ key, values, condition });
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
 * Helper function to update an item
 * @returns an UpdateItem request
 */
function dynamodbUpdateRequest(params) {
    const { key, values, condition: inCondObj } = params;

    const sets = [];
    const removes = [];
    const expressionNames = {};
    const expValues = {};

    // Iterate through the keys of the values
    for (const key in values) {
        // Save the name
        expressionNames[`#${key}`] = key;
        const value = values[key];
        if (value) {
            // If there is a value, add it to list to be updated
            sets.push(`#${key} = :${key}`);
            expValues[`:${key}`] = value;
        } else {
            // If the value is null, add it to the list to be removed
            removes.push(`#${key}`);
        }
    }

    let expression = '';
    expression += sets.length ? `SET ${sets.join(', ')}` : '';
    expression += removes.length ? ` REMOVE ${removes.join(', ')}` : '';

    let condition;
    if (inCondObj) {
        condition = JSON.parse(util.transform.toDynamoDBConditionExpression(inCondObj));
        if (condition.expressionValues && !Object.keys(condition.expressionValues).length) {
            delete condition.expressionValues;
        }
    }
    return {
        operation: 'UpdateItem',
        key: util.dynamodb.toMapValues(key),
        condition,
        update: {
            expression,
            expressionNames,
            expressionValues: util.dynamodb.toMapValues(expValues),
        },
    }
}