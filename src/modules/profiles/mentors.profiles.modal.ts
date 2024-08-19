import { Schema, model, Document, Types } from 'mongoose';

export interface IMentorProfile extends Document {
    user: Types.ObjectId;
    username?: string;
    bio?: string;
    expertise?: string[];
    isDeleted: boolean;
}

const mentorProfileSchema = new Schema<IMentorProfile>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'tbl_users',
        required: true,
        index: true,
    },
    username: {
        type: String,
        default: null,
        unique: true
    },
    bio: {
        type: String,
        default: null
    },
    expertise: [{
        type: String,
        default: null
    }],
    isDeleted: {
        type: Boolean,
        default: false,
    },
});

export const MentorProfiles = model<IMentorProfile>('tbl_mentor_profiles', mentorProfileSchema);
