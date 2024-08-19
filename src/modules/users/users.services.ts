import { SignJwt } from "../../lib/tokens";
import bcrypt from "bcrypt"
import { Accounts } from "../accounts/accounts.modal";
import { AccountServices } from "../accounts/accounts.services";
import { StudentPreferences } from "../preferences/student.preferences.modal";
import { StudentProfiles } from "../profiles/student.profiles.modal";
import { IUser, Users } from "./users.modal";

export default class UserServices {
    /**
     * Registers a new user and creates associated Profile and Preferences.
     * @param email - The user's email address.
     * @param password - The user's password.
     * @param provider - The provider (e.g., 'local' for local authentication).
     * @param providerId - The provider-specific ID (used for OAuth providers).
    */
    static async registerUser(email: string, password: string | null, provider: 'google' | 'facebook' | 'discord' | 'local', providerId?: string, imageUrl?: string, role?: "student" | "mentors" | "institute"): Promise<IUser> {
        if (!email || !this.validateEmail(email)) {
            throw new Error('Invalid email address');
        }

        let hashedPassword: string | null = null;
        if (provider === 'local') {
            if (!password || password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const user = new Users({ email, role, imageUrl });
        await user.save();

        await Accounts.create({
            user: user._id,
            provider,
            providerId,
            password: hashedPassword,
        });

        return user;
    }

    /**
     * Reads a user by email.
     * @param email - The email address of the user.
     * @returns The user if found.
    */
    static async getUserByEmail(email: string) {
        const user = await Users.findOne({ email }).exec();
        if (!user || user.isDeleted) {
            return false
        }
        return user;
    }

    /**
     * Reads a user by ID.
     * @param userId - The ID of the user.
     * @returns The user if found.
    */
    static async getUserById(userId: string) {
        const user = await Users.findById(userId).exec();
        if (!user || user.isDeleted) {
            return false
        }
        return user;
    }

    /**
     * Updates user details.
     * @param userId - The ID of the user to update.
     * @param updates - The fields to update.
     * @returns The updated user.
    */
    static async updateUser(userId: string, updates: Partial<{ email: string; isVerified: boolean }>): Promise<IUser> {
        const user = await Users.findById(userId).exec();
        if (!user || user.isDeleted) {
            throw new Error('User not found');
        }

        // Update user details
        Object.assign(user, updates);
        await user.save();

        return user;
    }

    /**
     * Verifies the user's account status based on the `isVerified` field.
     * @param userId - The user's ID.
     * @returns The updated user object after verification.
     */
    static async verifyUser(userId: string): Promise<IUser> {
        try {
            const user = await Users.findById(userId).exec();

            if (!user || user.isDeleted) {
                throw new Error('User not found or already deleted');
            }

            if (user.isVerified) {
                throw new Error('User is already verified');
            }

            user.isVerified = true;
            await user.save();

            return user;
        } catch (error) {
            throw error
        }
    }

    /**
     * Deactivates a student (soft delete).
     * @param userId - The ID of the user to deactivate.
     * @returns The deactivated user.
    */
    static async deactivateStudentUser(userId: string): Promise<IUser> {
        const user = await Users.findById(userId).exec();
        if (!user || user.isDeleted) {
            throw new Error('User not found');
        }

        // Soft delete user and associated records
        user.isDeleted = true;
        await user.save();

        await Accounts.updateMany({ user: userId }, { isDeleted: true });
        await StudentProfiles.updateMany({ user: userId }, { isDeleted: true });
        await StudentPreferences.updateMany({ user: userId }, { isDeleted: true });

        return user;
    }

    /**
     * Activates a student (restores from soft delete).
     * @param userId - The ID of the user to activate.
     * @returns The activated user.
    */
    static async activateStudentUser(userId: string): Promise<IUser> {
        const user = await Users.findById(userId).exec();
        if (!user || !user.isDeleted) {
            throw new Error('User not found or not deactivated');
        }

        // Restore user and associated records
        user.isDeleted = false;
        await user.save();

        await Accounts.updateMany({ user: userId }, { isDeleted: false });
        await StudentProfiles.updateMany({ user: userId }, { isDeleted: false });
        await StudentPreferences.updateMany({ user: userId }, { isDeleted: false });

        return user;
    }

    /**
     * Validates the email address format.
     * @param email - The email address to validate.
     * @returns True if the email is valid, false otherwise.
    */
    private static validateEmail(email: string): boolean {
        // Basic email validation regex
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * Verifies if a given password matches the hashed password.
     * @param password - The password to verify.
     * @param hashedPassword - The hashed password to compare against.
     * @returns True if the password matches, false otherwise.
    */
    static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword); // Verify password using Bun
    }
}
