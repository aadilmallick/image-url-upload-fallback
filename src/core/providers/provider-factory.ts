import { CloudinaryProvider } from "./cloudinary-provider";
import { FirebaseProvider } from "./firebase-provider";
import { CloudinaryCredentials, FirebaseCredentials, ImageKitCredentials, S3Credentials } from "./credentials";
import { ImageKitProvider } from "./imagekit-provider";
import { S3Provider } from "./s3-provider";
import { LinkProvider } from "./link-provider";
import { ImageProvider, ProviderType } from "./types";
export function createProvider(type: ProviderType, credentials: unknown): ImageProvider { switch (type) { case "link": return new LinkProvider(); case "cloudinary": return new CloudinaryProvider(credentials as CloudinaryCredentials); case "imagekit": return new ImageKitProvider(credentials as ImageKitCredentials); case "s3": return new S3Provider(credentials as S3Credentials); case "firebase": return new FirebaseProvider(credentials as FirebaseCredentials); } }
