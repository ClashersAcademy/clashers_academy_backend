import mongoose, { Schema, Types } from "mongoose";


export interface IStudentPreference extends Document {
    user: Types.ObjectId;
    notifications: Record<string, boolean>;
    isDeleted: boolean;
}

const preferencesSchema = new Schema<IStudentPreference>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'tbl_users',
        index: true,
        required: true,
    },
    notifications: {
        type: Map,
        of: Boolean,
        default: {},
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
},
    {
        timestamps: true
    }
);

export const StudentPreferences = mongoose.model<IStudentPreference>('tbl_student_preferences', preferencesSchema);