import { Schema, model, Document, Types } from 'mongoose';

export interface IInstituteProfile extends Document {
    user: Types.ObjectId;
    username: string;
    instituteName?: string;
    location?: string;
    contactEmail?: string;
    contactNumber?: string;
    isDeleted: boolean;
}

const instituteProfileSchema = new Schema<IInstituteProfile>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'tbl_users',
        required: true,
        index: true,
    },
    username: {
        type: String,
        default: null,
    },
    instituteName: {
        type: String,
        default: null,
    },
    location: {
        type: String,
        default: null,
    },
    contactEmail: {
        type: String,
        default: null,
    },
    contactNumber: {
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

export const InstituteProfiles = model<IInstituteProfile>('tbl_institute_profiles', instituteProfileSchema);
