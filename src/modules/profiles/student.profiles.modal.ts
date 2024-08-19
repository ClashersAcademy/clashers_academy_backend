import { Schema, model, Document, Types } from 'mongoose';

export interface IStudentProfile extends Document {
    user: Types.ObjectId;
    username?: string;
    bio?: string;
    awards?: Types.ObjectId[];
    school?: string;
    isDeleted: boolean;
}

const profileSchema = new Schema<IStudentProfile>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'tbl_users',
        required: true,
        index: true,
    },
    username: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        default: null
    },
    awards: [{
        type: Schema.Types.ObjectId,
    }],
    school: {
        type: String,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
});

export const StudentProfiles = model<IStudentProfile>('tbl_student_profiles', profileSchema);
