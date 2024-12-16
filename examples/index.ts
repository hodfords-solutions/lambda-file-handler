import { SnsEvent } from '@hodfords/lfh-file-handler/type';
import fs from 'node:fs';
import { FileHandler } from '@hodfords/lfh-file-handler';
import { FileDetail, S3File } from '@hodfords/lfh-common';
import { ImageHandler } from '@hodfords/lfh-image-handler';
import { AudioHandler } from '@hodfords/lfh-audio-handler';
import { VideoHandler } from '@hodfords/lfh-video-handler';

async function main() {
    let event: { Records: SnsEvent[] } = JSON.parse(fs.readFileSync('./events/video.json', 'utf-8'));
    console.log('Start');
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
    console.log('Start');
}

main();
