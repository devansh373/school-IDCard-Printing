// Password validation utilities

export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Validates password strength
 * Requirements:
 * - At least 8 characters long
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 * - Contains at least one special character
 */
export function validatePasswordStrength(
    password: string
): PasswordValidationResult {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    }

    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }

    if (!/[0-9]/.test(password)) {
        errors.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push("Password must contain at least one special character");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Checks if password contains common weak patterns
 */
export function checkCommonPasswords(password: string): boolean {
    const commonPasswords = [
        "password",
        "123456",
        "12345678",
        "admin",
        "admin123",
        "password123",
        "qwerty",
        "letmein",
        "welcome",
    ];

    return commonPasswords.some((common) =>
        password.toLowerCase().includes(common)
    );
}
