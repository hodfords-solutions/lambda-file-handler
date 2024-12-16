import { Config, ImageResult, VideoResult } from './type';
import { FileHandlerInterface, getNewDimension, S3File, Dimension, FileDetail } from '@hodfords/lfh-common';
import ffmpeg, { ffprobe } from 'fluent-ffmpeg';
import * as fs from 'node:fs';

export class VideoHandler implements FileHandlerInterface {
    private videos: VideoResult[] = [];
    private thumbnail: ImageResult;
    private fileMetadata: ffmpeg.FfprobeData;

    constructor(
        public file: S3File,
        private config: Config
    ) {}

    async validation(): Promise<boolean> {
        return this.config.allowMimeType.some((mimeType) => {
            if (/\*/.test(mimeType)) {
                return RegExp(mimeType).test(this.file.s3.detail.mimeType);
            }

            return mimeType === this.file.s3.detail.mimeType;
        });
    }

    async handle(): Promise<void> {
        this.fileMetadata = await this.getFileMetadata();
        const extensions = this.getExtensions();
        this.videos = await Promise.all(
            this.getActualDimensions()
                .map((dimension) =>
                    extensions.map((format) => ({
                        dimension,
                        format
                    }))
                )
                .flat()
                .map(({ dimension, format }) => this.resizeVideo(format, dimension))
        );
        this.thumbnail = await this.getThumbnail();
    }

    getActualDimensions(): Dimension[] {
        return this.config.dimensions
            .map((dimension) => this.getActualDimension(dimension))
            .filter(
                (pair, index, self) =>
                    index === self.findIndex((p) => p.width === pair.width && p.height === pair.height)
            );
    }

    async getFileMetadata(): Promise<ffmpeg.FfprobeData> {
        return new Promise((resolve, reject) => {
            ffprobe(this.getCurrentLocalPath(), (err, data) => {
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    }

    getVideoStream(): ffmpeg.FfprobeStream {
        for (let stream of this.fileMetadata.streams) {
            if (stream.codec_type === 'video') {
                return stream;
            }
        }
    }

    async resizeVideo(format: string, dimension: Dimension): Promise<VideoResult> {
        const name = this.getFileName(format, dimension);
        await new Promise((resolve, reject) => {
            const convertJob = ffmpeg(this.getCurrentLocalPath())
                .size(`${dimension.width}x${dimension.height}`)
                .audioCodec(this.config.acodec || 'copy')
                .on('error', (err) => reject(err))
                .on('end', () => resolve(true))
                .format(format)
                .output(`${this.file.local.tmpDir}/${name}`);
            if (this.getVideoStream()['codec_name'] !== 'h264') {
                convertJob.videoCodec(this.config.vcodec || 'libx264');
            }
            convertJob.run();
        });

        return {
            name,
            dimension: { width: dimension.width, height: dimension.height },
            format: format,
            duration: this.fileMetadata.format.duration,
            size: this.getFileSize(`${this.file.local.tmpDir}/${name}`),
            isOriginal: false,
            type: 'video'
        };
    }

    getActualDimension(dimension: Dimension): Dimension {
        if (dimension.keepAspectRatio) {
            const videoStream = this.getVideoStream();
            return getNewDimension({ width: videoStream.width, height: videoStream.height }, dimension);
        }
        return dimension;
    }

    async getThumbnail(): Promise<ImageResult> {
        let actualDimension = this.getActualDimension(this.config.thumbnailDimension);
        let extension = this.config.thumbnailFormat || 'jpg';
        const thumbnailPath = `${this.file.local.tmpDir}/${this.file.local.key}.${extension}`;
        await new Promise((resolve, reject) => {
            ffmpeg(this.getCurrentLocalPath())
                .on('end', () => resolve(true))
                .on('error', (err) => reject(err))
                .screenshots({
                    count: 1,
                    timemarks: [this.config.thumbnailTimemark || '50%'],
                    folder: this.file.local.tmpDir,
                    filename: `${this.file.local.key}.${extension}`,
                    size: `${actualDimension.width}x${actualDimension.height}`
                });
        });

        return {
            name: `${this.file.local.key}.${extension}`,
            dimension: actualDimension,
            format: extension,
            size: this.getFileSize(thumbnailPath),
            isOriginal: false,
            type: 'image'
        };
    }

    getCurrentLocalPath() {
        return `${this.file.local.tmpDir}/${this.file.local.key}.${this.file.rootExtension}`;
    }

    getFileName(format: string, dimension: Dimension) {
        return `${this.file.local.key}-${dimension.width}_${dimension.height}.${format}`;
    }

    getFileSize(path: string): number {
        const stats = fs.statSync(path);
        return stats.size;
    }

    getExtensions(): string[] {
        if (this.config.keepOriginalFormat) {
            return [this.file.rootExtension];
        }

        if (this.config.format) {
            return this.config.format;
        }

        return ['mp4'];
    }

    getResult(): FileDetail[] {
        let videos = this.videos;
        if (this.config.keepOriginalFile && !videos.some((video) => video.isOriginal)) {
            const videoStream = this.getVideoStream();
            videos.push({
                name: this.file.local.key,
                dimension: { width: videoStream.width, height: videoStream.height },
                format: this.file.rootExtension,
                duration: this.fileMetadata.format.duration,
                size: this.getFileSize(this.getCurrentLocalPath()),
                isOriginal: true,
                type: 'video'
            });
        }

        return [...videos, this.thumbnail];
    }
}
