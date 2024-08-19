import { Accounts } from "./accounts.modal";

export class AccountServices {
    /**
     * Creates a new account for a user with a specific provider.
     * @param userId - The ID of the user.
     * @param provider - The provider (e.g., 'google', 'facebook').
     * @param providerId - The provider-specific ID.
     * @returns The created account.
     */
    static async createAccount(userId: string, provider: 'google' | 'facebook' | 'discord' | 'local', providerId?: string) {
        try {
            const account = new Accounts({
                user: userId,
                provider,
                providerId
            });

            await account.save();
            return account;
        } catch (error) {
            throw error
        }
    }

    /**
     * Creates a new account for a user with a specific provider (Linking account).
     * @param userId - The ID of the user.
     * @param provider - The provider (e.g., 'google', 'facebook').
     * @param providerId - The provider-specific ID.
     * @returns The created or linked account.
     */
    static async linkAccount(userId: string, provider: 'google' | 'facebook' | 'discord' | 'local', providerId?: string, password?: string) {
        try {
            const existingAccount = await Accounts.findOne({ user: userId, provider }).exec();
            if (existingAccount) {
                throw new Error(`Account already linked with provider ${provider}`);
            }

            const account = new Accounts({
                user: userId,
                provider,
                providerId,
                password,
            });

            await account.save();
            return account;
        } catch (error) {
            throw error
        }
    }

    /**
     * Unlinks an existing account from a user.
     * @param userId - The ID of the user.
     * @param provider - The provider to unlink (e.g., 'google', 'facebook').
     * @returns A confirmation message.
     */
    static async unlinkAccount(userId: string, provider: 'google' | 'facebook' | 'discord' | 'local') {
        try {
            const account = await Accounts.findOne({ user: userId, provider }).exec();
            if (!account) {
                throw new Error(`No account linked with provider ${provider}`);
            }

            // Ensure at least one provider is still linked before unlinking
            const linkedAccounts = await Accounts.countDocuments({ user: userId }).exec();
            if (linkedAccounts <= 1) {
                throw new Error('Cannot unlink the last linked account.');
            }

            await account.deleteOne();
            return true;
        } catch (error) {
            throw error
        }
    }

    /**
     * Finds an account by user ID and provider.
     * @param userId - The ID of the user.
     * @param provider - The provider (e.g., 'local' for local authentication).
     * @returns The account if found.
    */
    static async findAccountByUserIdAndProvider(userId: string, provider: 'google' | 'facebook' | 'discord' | 'local') {
        const account = await Accounts.findOne({ user: userId, provider }).exec();
        if (!account || account.isDeleted) {
            return false
        }
        return account;
    }

    /**
     * Updates account by email.
     * @param email - The email address of the user.
     * @param updates - The fields to update in the account.
     * @returns The updated account.
    */
    static async updateAccountByEmail(email: string, updates: Partial<{ password: string; providerId: string }>) {
        const account = await Accounts.findOne({ email }).exec();
        if (!account || account.isDeleted) {
            throw new Error('Account not found');
        }

        Object.assign(account, updates);
        await account.save();

        return account;
    }


}