import {
  getCaseMaterialCompositePng,
  resolveCaseMaterialImageUrl,
} from '../../client/src/utils/case-material-clipboard';

describe('case material clipboard', () => {
  it('resolves Miaoda storage paths to absolute image URLs', () => {
    const path = '/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/bucket_x/1.jpg';

    expect(resolveCaseMaterialImageUrl(path, 'https://guanghe.feishuapp.com'))
      .toBe('https://guanghe.feishuapp.com/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/bucket_x/1.jpg');
  });

  it('rejects empty image packages before reporting copy success', async () => {
    await expect(getCaseMaterialCompositePng({
      imageUrls: [],
      text: '',
      includeText: false,
    })).rejects.toThrow('No images to copy');
  });
});
