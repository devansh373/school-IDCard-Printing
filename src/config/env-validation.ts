// Environment variable validation
// This file validates all required environment variables on application startup

interface RequiredEnvVars {
    [key: string]: {
        required: boolean;
        description: string;
    };
}

const envVars: RequiredEnvVars = {
    // Database
    DATABASE_URL: {
        required: true,
        description: "PostgreSQL database connection string",
    },

    // Authentication
    JWT_SECRET: {
        required: true,
        description: "Secret key for JWT token signing",
    },

    // ImageKit (Global - Optional, can be per-school)
    IMAGEKIT_PUBLIC_KEY: {
        required: false,
        description: "ImageKit public key (optional if using per-school config)",
    },
    IMAGEKIT_PRIVATE_KEY: {
        required: false,
        description: "ImageKit private key (optional if using per-school config)",
    },
    IMAGEKIT_URL_ENDPOINT: {
        required: false,
        description: "ImageKit URL endpoint (optional if using per-school config)",
    },

    // Email
    RESEND_API_KEY: {
        required: false,
        description: "Resend API key for sending emails (optional)",
    },

    // Admin Credentials (for seed script)
    ADMIN_PASSWORD: {
        required: true,
        description: "Password for super admin account",
    },
    ADMIN_EMAIL: {
        required: false,
        description: "Email for super admin account (defaults to admin@vendor.com)",
    },

    // Server
    PORT: {
        required: false,
        description: "Server port (defaults to 5000)",
    },
    NODE_ENV: {
        required: false,
        description: "Environment mode (development, production)",
    },
};

export function validateEnvironment(): void {
    const missing: string[] = [];
    const warnings: string[] = [];

    for (const [key, config] of Object.entries(envVars)) {
        const value = process.env[key];

        if (config.required && !value) {
            missing.push(`${key}: ${config.description}`);
        } else if (!config.required && !value) {
            warnings.push(`${key}: ${config.description} (optional, not set)`);
        }
    }

    if (missing.length > 0) {
        console.error("\n❌ FATAL: Missing required environment variables:\n");
        missing.forEach((msg) => console.error(`  - ${msg}`));
        console.error("\nPlease set these variables in your .env file.\n");
        process.exit(1);
    }

    if (warnings.length > 0 && process.env.NODE_ENV === "production") {
        console.warn("\n⚠️  WARNING: Optional environment variables not set:\n");
        warnings.forEach((msg) => console.warn(`  - ${msg}`));
        console.warn("");
    }

    // Additional validation
    if (process.env.NODE_ENV === "production") {
        // Ensure JWT_SECRET is strong enough
        if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
            console.error(
                "\n❌ FATAL: JWT_SECRET must be at least 32 characters long in production.\n"
            );
            process.exit(1);
        }

        // Warn if using default admin email
        if (
            !process.env.ADMIN_EMAIL ||
            process.env.ADMIN_EMAIL === "admin@vendor.com"
        ) {
            console.warn(
                "\n⚠️  WARNING: Using default admin email. Set ADMIN_EMAIL for production.\n"
            );
        }
    }

    console.log("✅ Environment validation passed\n");
}
