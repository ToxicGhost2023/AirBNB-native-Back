import { model, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true, trim: true },
    userName: { type: String, unique: true, required: true, trim: true },
    profilePicture: { type: String },
    verifiedMobile: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["user", "Ad-admin", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

export const UserModel = model("User", UserSchema);
