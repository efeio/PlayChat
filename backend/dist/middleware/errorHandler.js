export function errorHandler(error, _request, reply) {
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
        error: error.message || 'Internal Server Error',
    });
}
//# sourceMappingURL=errorHandler.js.map