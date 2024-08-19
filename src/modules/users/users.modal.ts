import { Schema, model, Document } from 'mongoose';
import { StudentProfiles } from '../profiles/student.profiles.modal';
import { StudentPreferences } from '../preferences/student.preferences.modal';
import { MentorProfiles } from '../profiles/mentors.profiles.modal';
import { MentorPreferences } from '../preferences/mentor.preferences.modal';
import { InstituteProfiles } from '../profiles/institute.profile.modal';
import { InstitutePreferences } from '../preferences/institute.preference.modal';

export interface IUser extends Document {
    email: string;
    isVerified: boolean;
    role: "student" | "mentors" | "institute";
    imageUrl: string;
    isDeleted: boolean;
}

const userSchema = new Schema<IUser>({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
        lowercase: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ["student", "mentors", "institute"],
        default: "student"
    },
    imageUrl: {
        type: String,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true
});

userSchema.pre('save', async function (next) {
    try {
        if (this.isNew) {
            const role = this.role

            switch (role) {
                case "student":
                    await StudentProfiles.create({ user: this._id });
                    await StudentPreferences.create({ user: this._id });
                    break;
                case "mentors":
                    await MentorProfiles.create({ user: this._id });
                    await MentorPreferences.create({ user: this._id });
                    break;
                case "institute":
                    await InstituteProfiles.create({ user: this._id });
                    await InstitutePreferences.create({ user: this._id });
                    break;
                default:
                    break;
            }
        }

        next()
    } catch (error) {
        throw error
    }
});

export const Users = model<IUser>('tbl_users', userSchema);
