import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ImageProxyService } from './image-proxy.service';

@Controller('api/image-proxy')
export class ImageProxyController {
  constructor(private readonly imageProxyService: ImageProxyService) {}

  @Get()
  async getImage(
    @Query('path') path: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const forwardedProto = request.header('x-forwarded-proto')?.split(',')[0]?.trim();
    const forwardedHost = request.header('x-forwarded-host')?.split(',')[0]?.trim();
    const requestOrigin = forwardedProto === 'https' && forwardedHost
      ? `https://${forwardedHost}`
      : undefined;
    const image = await this.imageProxyService.fetchStorageImage({
      path,
      requestOrigin,
      cookie: request.header('cookie'),
      authorization: request.header('authorization'),
    });
    response.setHeader('Content-Type', image.contentType);
    response.setHeader('Content-Length', String(image.body.byteLength));
    response.setHeader('Content-Disposition', 'inline');
    response.setHeader('Cache-Control', 'private, max-age=300');
    response.send(Buffer.from(image.body));
  }
}
