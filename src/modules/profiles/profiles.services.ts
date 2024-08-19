import { Users } from "../users/users.modal";
import { InstituteProfiles } from "./institute.profile.modal";
import { MentorProfiles } from "./mentors.profiles.modal";
import { StudentProfiles } from "./student.profiles.modal";

export class ProfileServices {
    /**
     * Finds an account by user ID and provider.
     * @param userId - The ID of the user.
     * @returns The account if found.
    */
    static async findProfileByUserId(userId: string, role: "student" | "mentors" | "institute") {
        try {
            let profile;

            switch (role) {
                case "student":
                    profile = await StudentProfiles.findOne({ user: userId }).exec();
                    break;
                case "mentors":
                    profile = await MentorProfiles.findOne({ user: userId }).exec();
                    break;
                case "institute":
                    profile = await InstituteProfiles.findOne({ user: userId }).exec();
                    break;
                default:
                    break;
            }

            if (!profile || profile.isDeleted) {
                throw new Error('Profile not found');
            }
            return profile;
        } catch (error) {
            throw error
        }
    }

    /**
     * Updates student profile by user ID.
     * @param userId - The ID of the user.
     * @param updates - The fields to update in the profile.
     * @returns The updated profile.
    */
    static async updateProfileById(userId: string, updates: Partial<{ username: string; bio: string; school: string }>, role: "student" | "mentors" | "institute") {
        try {
            const profile = await this.findProfileByUserId(userId, role)
            if (!profile || profile.isDeleted) {
                throw new Error('Profile not found');
            }

            // Update profile details
            Object.assign(profile, updates);
            await profile.save();

            return profile;
        } catch (error) {
            throw error
        }
    }

    /**
     * Updates student profile by email.
     * @param email - The email address of the user.
     * @param updates - The fields to update in the profile.
     * @returns The updated profile.
    */
    static async updateProfileByEmail(email: string, updates: Partial<{ username: string; bio: string; school: string }>, role: "student" | "mentors" | "institute") {
        try {
            const user = await Users.findOne({ email }).exec();
            if (!user || user.isDeleted) {
                throw new Error('User not found');
            }

            return this.updateProfileById(user.id, updates, role);
        } catch (error) {
            throw error
        }
    }
}