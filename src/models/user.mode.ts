import mongoose from "mongoose";
import {IUser} from "../types/user";
import bcrypt from "bcrypt";
import jwt, { Secret, sign, SignOptions } from "jsonwebtoken";

const userSchema = new mongoose.Schema<IUser>(
  {
    userName: {
      type: String,
      required: [true, "Username is required"],
      unique: [true, "Username already exists"],
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email already exists"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
    },
    bio: {
      type: String,
      default: "",
    },
    avatarImage: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    postsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  } catch (err) {
    console.log("error while hasing the password", err);
  }
});

userSchema.methods.comparePassword = async function (password: string) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (err) {
    console.log("error while comparing the hashed and normal password", err);
    return false;
  }
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      userName: this.userName,
      fullName: this.fullName,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET as Secret,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
    } as SignOptions,
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET as Secret,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
    } as SignOptions,
  );
};

userSchema.index({ userName: "text"});

export default mongoose.model<IUser>("User", userSchema);
