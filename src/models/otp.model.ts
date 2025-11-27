import { Schema, model,Types } from "mongoose";

interface IOTP {
  userId: Types.ObjectId;
  email: string;
  code: string;
  expiresAt: Date;
}

const EXPIRATION_TIME = 5 * 60 * 1000;

const OTPSchema = new Schema<IOTP>({
  userId: { 
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  email: {
    type: String,
    required: true,
    index: true,
  },
  code: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + EXPIRATION_TIME),
  },
},
{
  timestamps: true,
});

// Auto-delete expired OTPs (Mongo TTL index)
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTPModel = model<IOTP>("OTP", OTPSchema);
