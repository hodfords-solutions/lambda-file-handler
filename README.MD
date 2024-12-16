File handler
- [x] Developer config
  - event
  - handler: (file) => Promise<void>
- [x] Receive event from lambda
- [x] Create temp folder for this session
- [x] Get file from S3 to local
- [x] Validation file
- [x] Handle file (image, audio, video, ...)
- [x] Upload file to S3
- [x] Send event to SNS
- [x] Delete temp folder

Image handler
- [x] Developer config
  - path: path to s3
  - localPath: path to file in local
  - sizes: { width, height }[]
  - allowMimeType: string[]
  - format: [ 'jpg', 'png', 'webp' ]
  - keepOriginalFormat: boolean (default false)
  - keepLargeFileIsOriginalFormat: boolean (default false)
  - keepOriginalFile: boolean (default false)
  - heicToJpg: boolean (default false)
- [x] Get image details
- [x] Validate image
- [x] Resize image (keep ratio)
- [x] Convert image to jpg
- [x] Upload image to S3

Audio handler
- [x] Developer config
  - path: path to s3
  - localPath: path to file in local
  - format: [ 'mp3', 'wav', 'ogg' ]
  - keepOriginalFormat: boolean
  - keepOriginalFile: boolean
  - allowMimeType: string[]
- [x] Get audio
- [x] Convert audio to mp3
- [x] Upload audio to S3

Video handler
- [x] Developer config
    - path: path to s3
    - localPath: path to file in local
    - format: [ 'mp4', 'webm', 'ogg' ]
    - allowMimeType: string[]
    - keepOriginalFormat: boolean
    - keepOriginalFile: boolean
    - thumbnailSize: { width, height }
    - sizes: { width, height }[]
- [x] Get video
- [x] Validate video
- [x] Get thumbnail
- [x] Convert video to mp4 (max full hd)
- [x] Upload video to S3
