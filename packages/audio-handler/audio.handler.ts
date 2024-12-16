import { AudioResult, Config } from './type';
import { FileHandlerInterface, S3File } from '@hodfords/lfh-common';
import ffmpeg, { ffprobe } from 'fluent-ffmpeg';
import * as fs from 'node:fs';

export class AudioHandler implements FileHandlerInterface {
    private results: AudioResult[] = [];
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
        this.results = await Promise.all(extensions.map((format) => this.encodeAudio(format)));
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

    async encodeAudio(format: string): Promise<AudioResult> {
        if (format === this.file.rootExtension) {
            return {
                name: this.file.local.key,
                duration: this.fileMetadata.format.duration,
                format: this.file.rootExtension,
                size: this.getFileSize(this.getCurrentLocalPath()),
                isOriginal: true,
                type: 'audio'
            };
        }

        const name = this.getFileName(format);
        await new Promise((resolve, reject) => {
            ffmpeg(this.getCurrentLocalPath())
                .format(format)
                .on('error', (err) => reject(err))
                .on('end', () => resolve(true))
                .save(`${this.file.local.tmpDir}/${name}`);
        });

        return {
            name,
            format: format,
            duration: this.fileMetadata.format.duration,
            size: this.getFileSize(`${this.file.local.tmpDir}/${name}`),
            isOriginal: false,
            type: 'audio'
        };
    }

    getCurrentLocalPath(): string {
        return `${this.file.local.tmpDir}/${this.file.local.key}.${this.file.rootExtension}`;
    }

    getFileName(format: string): string {
        return `${this.file.local.key}.${format}`;
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

        return ['mp3'];
    }

    getResult(): AudioResult[] {
        let audios = this.results;
        if (this.config.keepOriginalFile && !audios.some((audio) => audio.isOriginal)) {
            audios.push({
                name: this.file.local.key,
                duration: this.fileMetadata.format.duration,
                format: this.file.rootExtension,
                size: this.getFileSize(this.getCurrentLocalPath()),
                isOriginal: true,
                type: 'audio'
            });
        }

        return audios;
    }
}
