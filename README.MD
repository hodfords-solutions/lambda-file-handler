<p align="center">
  <a href="http://opensource.hodfords.uk" target="blank"><img src="https://opensource.hodfords.uk/img/logo.svg" width="320" alt="Nest Logo" /></a>
</p>

<p align="center">
Lambda file uploader for AWS S3. Receive events from S3 -> SNS -> Lambda. Generate thumbnails, encode video/audio, resize video/image.
</p>

## Installation 🤖

To begin using it, we first install the required dependencies.

```
npm install @hodfords/lfh-common @hodfords/lfh-file-handler
```

## Sample 🤖

```typescript
let event: { Records: SnsEvent[] } = JSON.parse(fs.readFileSync('./events/video.json', 'utf-8'));
let fileHandler = new FileHandler(
  {
    awsConfig: {
      region: 'xxx',
      credentials: {
        accessKeyId: 'xxx',
        secretAccessKey: 'xxx'
      }
    },
    pathFactory: (original: S3File, result: FileDetail) => {
      return `test/${result.name}`;
    },
    aclFactory: (original: S3File, result: FileDetail) => {
      return 'private';
    },
    metadataFactory: (original: S3File, result: FileDetail) => {
      return {
        'x-amz-meta-uuid': '14365123651274'
      };
    },
    handler: (file: S3File) => {
      if (file.local.fileType.startsWith('image')) {
        return new ImageHandler(file, {
          allowMimeType: ['images/*'],
          dimensions: [
            { width: 100, height: 100, keepAspectRatio: false },
            { width: 200, height: 200, keepAspectRatio: true }
          ],
          format: ['webp'],
          keepOriginalFormat: false
        });
      }

      if (file.local.fileType.startsWith('audio')) {
        return new AudioHandler(file, {
          allowMimeType: ['audio/*'],
          format: ['mp3'],
          keepOriginalFormat: false,
          keepOriginalFile: false
        });
      }

      if (file.local.fileType.startsWith('video')) {
        return new VideoHandler(file, {
          dimensions: [{ height: 320, width: 240, keepAspectRatio: true }],
          thumbnailDimension: { width: 240, height: 320, keepAspectRatio: true },
          allowMimeType: ['video/*'],
          format: ['mp4'],
          keepOriginalFormat: false,
          keepOriginalFile: false
        });
      }
    }
  },
  event.Records
);
await fileHandler.handle();
```

## Image Handler 🖼

Image file processing, resizing, converting.
Use case: 
- Resize image to specific dimensions.
- Convert image to webp/jpg format.
- Generate thumbnails.
- Keep original format/file and validate mime type.

> **Note:** `ImageHandler` uses `sharp` to process images.
> For HEIC files, use a lambda layer that supports this.

#### Install

```shell
npm install @hodfords/lfh-image-handler
```

```typescript
new ImageHandler(
    file, 
    {
      allowMimeType: ['images/*'],
      dimensions: [
        { width: 100, height: 100, keepAspectRatio: false },
        { width: 200, height: 200, keepAspectRatio: true }
      ],
      format: ['webp'],
      keepOriginalFormat: false
    }
);
```

## Audio Handler 🔊

Audio file processing, converting.
Use case:
- Convert audio to mp3/any format.
- Encode audio files.
- Keep original format/file and validate mime type.


> **Note:** `AudioHandler` uses `fluent-ffmpeg` to process audio files.

#### Install

```shell
npm install @hodfords/lfh-audio-handler
```

```typescript
new AudioHandler(
    file, 
    {
      allowMimeType: ['audio/*'],
      format: ['mp3'],
      keepOriginalFormat: false,
      keepOriginalFile: false
    }
);
```

## Video Handler 📹

Video file processing, resizing, converting, thumbnail generation.
Use case:
- Resize video to specific dimensions like HD, FHD,...
- Convert video to mp4/any format.
- Generate thumbnails.
- Keep original format/file and validate mime type.

> **Note:** `VideoHandler` uses `fluent-ffmpeg` to process video files.


#### Install

```shell
npm install @hodfords/lfh-video-handler
```

```typescript
new VideoHandler(
    file, 
    {
      dimensions: [{ height: 320, width: 240, keepAspectRatio: true }],
      thumbnailDimension: { width: 240, height: 320, keepAspectRatio: true },
      allowMimeType: ['video/*'],
      format: ['mp4'],
      keepOriginalFormat: false,
      keepOriginalFile: false
    }
);
```


## License

This project is licensed under the MIT License
