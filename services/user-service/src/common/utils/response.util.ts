export class ResponseUtil {
    static success<T>(data: T, message = 'Success') {
        return {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
        };
    }

    static error(message: string, error?: any, statusCode?: number) {
        return {
            success: false,
            message,
            error: error?.message || error,
            statusCode: statusCode || 500,
            timestamp: new Date().toISOString(),
        };
    }

    static paginate<T>(data: T[], total: number, page: number, limit: number) {
        return {
            success: true,
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            timestamp: new Date().toISOString(),
        };
    }
}