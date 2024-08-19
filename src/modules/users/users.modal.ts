import { Schema, model, Document } from 'mongoose';
import { StudentProfiles } from '../profiles/student.profiles.modal';
import { StudentPreferences } from '../preferences/student.preferences.modal';

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

userSchema.post('save', async function (doc) {
    try {
        const role = doc.role

        switch (role) {
            case "student":
                await StudentProfiles.create({ user: doc._id });
                await StudentPreferences.create({ user: doc._id });
                break;
            case "mentors":
                break;
            case "institute":
                break;
            default:
                break;
        }
    } catch (error) {
        throw error
    }
});

export const Users = model<IUser>('tbl_users', userSchema);
