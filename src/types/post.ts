import { Platform } from "./platform";

export enum PostStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  QUEUED = "queued",
  PUBLISHING = "publishing",
  PUBLISHED = "published",
  FAILED = "failed",
  PARTIALLY_PUBLISHED = "partially_published",
}

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  GIF = "gif",
}

export interface MediaAsset {
  id: string;
  url: string;
  type: MediaType;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUrl?: string;
}

export interface PlatformPostContent {
  platform: Platform;
  text: string;
  media: MediaAsset[];
  platformSpecificData?: Record<string, unknown>;
}

export interface Post {
  id: string;
  userId: string;
  title?: string;
  content: string;
  platforms: PlatformPostContent[];
  media: MediaAsset[];
  status: PostStatus;
  scheduledAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostCreateInput {
  content: string;
  platforms: Platform[];
  media?: MediaAsset[];
  scheduledAt?: Date;
  platformOverrides?: Partial<Record<Platform, { text?: string }>>;
}
