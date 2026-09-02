import { BadGatewayException, BadRequestException, Injectable, Logger } from '@nestjs/common';

const STORAGE_PATH_PREFIX = '/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/';
const DEFAULT_PUBLIC_ORIGIN = 'https://guanghe.feishuapp.com';

export interface ProxiedImage {
  body: Uint8Array;
  contentType: string;
}

export function buildStorageObjectUrl(path: string, requestOrigin?: string): string {
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(path).split('?')[0];
  } catch {
    throw new BadRequestException('图片路径格式无效');
  }
  if (!decodedPath.startsWith(STORAGE_PATH_PREFIX) || decodedPath.includes('..')) {
    throw new BadRequestException('仅支持当前应用的素材图片');
  }
  const origin = requestOrigin?.startsWith('https://') ? requestOrigin : DEFAULT_PUBLIC_ORIGIN;
  return new URL(decodedPath, origin).toString();
}

@Injectable()
export class ImageProxyService {
  private readonly logger = new Logger(ImageProxyService.name);

  async fetchStorageImage(options: {
    path: string;
    requestOrigin?: string;
    cookie?: string;
    authorization?: string;
  }): Promise<ProxiedImage> {
    const imageUrl = buildStorageObjectUrl(options.path, options.requestOrigin);
    const headers = new Headers({ Accept: 'image/png,image/jpeg,image/webp,image/*;q=0.8' });
    if (options.cookie) headers.set('Cookie', options.cookie);
    if (options.authorization) headers.set('Authorization', options.authorization);

    let response: Response;
    try {
      response = await fetch(imageUrl, { headers, cache: 'no-store', redirect: 'follow' });
    } catch (error) {
      this.logger.error(`Storage fetch failed: ${imageUrl}`, error instanceof Error ? error.stack : String(error));
      throw new BadGatewayException('素材图片读取失败');
    }

    const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const arrayBuffer = await response.arrayBuffer();
    this.logger.log(`Storage image response status=${response.status} type=${contentType || 'unknown'} size=${arrayBuffer.byteLength}`);
    if (!response.ok) throw new BadGatewayException(`素材图片请求失败：${response.status}`);
    if (!contentType.startsWith('image/')) {
      throw new BadGatewayException(`素材地址返回的不是图片：${contentType || 'unknown'}`);
    }
    if (arrayBuffer.byteLength === 0) throw new BadGatewayException('素材图片为空');
    return { body: new Uint8Array(arrayBuffer), contentType };
  }
}
