export interface IUser {
  _id: string; 
  userName: string;
  fullName: string;
  email: string;
  passwordHash: string;
  bio: string;
  avatarImage: string;
  coverImage: string;
  followersCount: number;
  followingCount: number;
  isVerified: boolean;
  postsCount: number;
  role: "user" | "admin" | "moderator";
  createdAt: Date;
  updatedAt: Date;
}
