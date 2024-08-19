import { Schema, model, Document, Types } from 'mongoose';

export interface IInstitutePreferences extends Document {
    user: Types.ObjectId;
    preferredCourseTypes?: string[];
    preferredStudentLevels?: string[];
    isDeleted: boolean;
}

const institutePreferencesSchema = new Schema<IInstitutePreferences>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'tbl_users',
        required: true,
        index: true,
    },
    preferredCourseTypes: {
        type: [String],
        default: [],
    },
    preferredStudentLevels: {
        type: [String],
        default: [],
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

export const InstitutePreferences = model<IInstitutePreferences>('tbl_institute_preferences', institutePreferencesSchema);
