// Validate JWT_SECRET is set
if (!process.env.JWT_SECRET) {
    throw new Error(
        "FATAL: JWT_SECRET environment variable is not set. " +
        "This is required for secure authentication. " +
        "Please set JWT_SECRET in your .env file."
    );
}

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = "1d";
