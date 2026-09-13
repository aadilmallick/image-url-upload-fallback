import { z } from "zod";
export const cloudinaryCredentialsSchema = z.object({ cloudName: z.string().min(1), apiKey: z.string().min(1), apiSecret: z.string().min(1), folder: z.string().max(255).optional() });
export const s3CredentialsSchema = z.object({ region: z.string().min(1), bucket: z.string().min(3), accessKeyId: z.string().min(1), secretAccessKey: z.string().min(1), publicBaseUrl: z.string().url().optional(), prefix: z.string().max(255).optional() });
export const imageKitCredentialsSchema = z.object({ privateKey: z.string().min(1), folder: z.string().max(255).optional() });
export const firebaseCredentialsSchema = z.object({ projectId: z.string().min(1), bucket: z.string().min(3), serviceAccount: z.object({ client_email: z.string().email(), private_key: z.string().min(1) }), prefix: z.string().max(255).optional() });
export type CloudinaryCredentials = z.infer<typeof cloudinaryCredentialsSchema>;
export type S3Credentials = z.infer<typeof s3CredentialsSchema>;
export type ImageKitCredentials = z.infer<typeof imageKitCredentialsSchema>;
export type FirebaseCredentials = z.infer<typeof firebaseCredentialsSchema>;
