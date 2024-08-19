import { Schema, model, Document, Types } from 'mongoose';

export interface IMentorPreferences extends Document {
    user: Types.ObjectId;
    preferredSubjects?: string[];
    preferredGradeLevels?: string[];
    availability?: string;
    isDeleted: boolean;
}

const mentorPreferencesSchema = new Schema<IMentorPreferences>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'tbl_users',
        required: true,
        index: true,
    },
    preferredSubjects: {
        type: [String],
        default: [],
    },
    preferredGradeLevels: {
        type: [String],
        default: [],
    },
    availability: {
        type: String,
        default: null,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

export const MentorPreferences = model<IMentorPreferences>('tbl_mentor_preferences', mentorPreferencesSchema);
