import { util } from "@aws-appsync/utils";

export function request(ctx) {
    return {
        operation: "Invoke",
        payload: {
            variables: ctx.arguments
        },
    };
}

export function response(ctx) {
    const { result, error } = ctx;
    if (error) {
        util.error(error.message, error.type, result);
    }

    if (!ctx.result.allow) {
        util.unauthorized();
    }

    return {};
}