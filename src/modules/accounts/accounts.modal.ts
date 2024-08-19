import mongoose, { Schema, Types } from "mongoose";

interface IAccount extends Document {
    user: Types.ObjectId;
    provider: 'google' | 'discord' | 'local',
    providerId?: string,
    password: string,
    isDeleted: boolean;
}

const accountSchema = new Schema<IAccount>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'tbl_users',
        required: true,
        index: true
    },
    provider: {
        type: String,
        enum: ['google', 'discord', 'local'],
        required: true,
    },
    providerId: {
        type: String,
    },
    password: {
        type: String,
        default: null,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true
});

export const Accounts = mongoose.model<IAccount>('tbl_accounts', accountSchema);
