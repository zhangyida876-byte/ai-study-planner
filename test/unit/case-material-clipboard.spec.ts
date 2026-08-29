import {
  buildCaseMaterialClipboardHtml,
  resolveCaseMaterialImageUrl,
} from '../../client/src/utils/case-material-clipboard';

describe('case material clipboard', () => {
  it('resolves Miaoda storage paths to absolute image URLs', () => {
    const path = '/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/bucket_x/1.jpg';

    expect(resolveCaseMaterialImageUrl(path, 'https://guanghe.feishuapp.com'))
      .toBe('https://guanghe.feishuapp.com/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/bucket_x/1.jpg');
  });

  it('builds rich clipboard HTML instead of exposing storage paths as plain text', () => {
    const imageUrl = 'https://guanghe.feishuapp.com/spark/app/app_4ke0jqzqjy118/runtime/api/v1/storage/object/bucket_x/1.jpg';
    const html = buildCaseMaterialClipboardHtml([imageUrl], '家长推荐话术', true);

    expect(html).toContain(`<img src="${imageUrl}"`);
    expect(html).toContain('家长推荐话术');
    expect(html).not.toBe(imageUrl);
  });

  it('escapes clipboard text and image attributes', () => {
    const html = buildCaseMaterialClipboardHtml(
      ['https://example.com/a.jpg?x=1&y=2'],
      '<建议>\n继续',
      true,
    );

    expect(html).toContain('&lt;建议&gt;<br>继续');
    expect(html).toContain('x=1&amp;y=2');
  });

  it('keeps embedded image data inside rich clipboard HTML', () => {
    const embeddedImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
    const html = buildCaseMaterialClipboardHtml([embeddedImage], '', false);

    expect(html).toContain(`<img src="${embeddedImage}"`);
    expect(html).not.toContain('/storage/object/');
  });
});
