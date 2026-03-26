import { Platform } from "@/types/platform";
import { type IPublishAdapter } from "./types";
import { XAdapter } from "./x.adapter";
import { TikTokAdapter } from "./tiktok.adapter";
import { InstagramAdapter } from "./instagram.adapter";
import { FacebookAdapter } from "./facebook.adapter";
import { SnapchatAdapter } from "./snapchat.adapter";

const adapterMap: Record<Platform, new () => IPublishAdapter> = {
  [Platform.X]: XAdapter,
  [Platform.TIKTOK]: TikTokAdapter,
  [Platform.INSTAGRAM]: InstagramAdapter,
  [Platform.FACEBOOK]: FacebookAdapter,
  [Platform.SNAPCHAT]: SnapchatAdapter,
};

export class AdapterFactory {
  private static instances: Partial<Record<Platform, IPublishAdapter>> = {};

  static getAdapter(platform: Platform): IPublishAdapter {
    if (!this.instances[platform]) {
      const AdapterClass = adapterMap[platform];
      if (!AdapterClass) {
        throw new Error(`No adapter found for platform: ${platform}`);
      }
      this.instances[platform] = new AdapterClass();
    }
    return this.instances[platform]!;
  }

  static getAllAdapters(): IPublishAdapter[] {
    return Object.values(Platform).map((p) => this.getAdapter(p));
  }
}
