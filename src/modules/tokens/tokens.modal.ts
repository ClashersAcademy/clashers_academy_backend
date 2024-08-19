import { Schema, model, Document } from 'mongoose';

export interface IToken extends Document {
    resetToken: string
}

const tokenSchema = new Schema<IToken>({
    resetToken: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    expireAfterSeconds: 3600000
});

export const Tokens = model<IToken>('tbl_tokens', tokenSchema);
