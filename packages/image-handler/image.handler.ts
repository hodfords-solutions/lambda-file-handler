import sharp from 'sharp';
import { Config, ImageResult } from './type';
import { FileHandlerInterface, getNewDimension, S3File, Dimension } from '@hodfords/lfh-common';

export class ImageHandler implements FileHandlerInterface {
    private results: ImageResult[] = [];
    private fileMetadata: sharp.Metadata;

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
        this.fileMetadata = await sharp(this.getCurrentLocalPath()).metadata();
        const extensions = this.getExtensions();
        this.results = await Promise.all(
            this.getActualDimensions()
                .map((dimension) =>
                    extensions.map((format) => ({
                        dimension,
                        format
                    }))
                )
                .flat()
                .map(({ dimension, format }) => this.resizeImage(format, dimension))
        );
    }

    getActualDimensions(): Dimension[] {
        return this.config.dimensions
            .map((dimension) => this.getActualDimension(dimension))
            .filter(
                (pair, index, self) =>
                    index === self.findIndex((p) => p.width === pair.width && p.height === pair.height)
            );
    }

    compareWithOriginal(format: string, dimension: Dimension): boolean {
        if (dimension.width !== this.fileMetadata.width || dimension.height !== this.fileMetadata.height) {
            return false;
        }
        return format === this.fileMetadata.format;
    }

    getActualDimension(dimension: Dimension): Dimension {
        if (dimension.keepAspectRatio) {
            return getNewDimension({ width: this.fileMetadata.width, height: this.fileMetadata.height }, dimension);
        }
        return dimension;
    }

    async resizeImage(format: string, dimension: Dimension): Promise<ImageResult> {
        if (this.compareWithOriginal(format, dimension)) {
            return {
                name: this.file.local.key,
                dimension: { width: this.fileMetadata.width, height: this.fileMetadata.height },
                format: this.file.rootExtension,
                size: this.fileMetadata.size,
                isOriginal: true,
                type: 'image'
            };
        }

        const name = this.getFileName(format, dimension);
        const image = await sharp(this.getCurrentLocalPath())
            .resize({
                ...dimension
            })
            .toFile(`${this.file.local.tmpDir}/${name}`);

        return {
            name,
            dimension: { width: image.width, height: image.height },
            format: image.format,
            size: image.size,
            isOriginal: false,
            type: 'image'
        };
    }

    getCurrentLocalPath(): string {
        return `${this.file.local.tmpDir}/${this.file.local.key}.${this.file.rootExtension}`;
    }

    getFileName(format: string, dimension: Dimension): string {
        return `${this.file.local.key}-${dimension.width}_${dimension.height}.${format}`;
    }

    getExtensions(): string[] {
        if (this.config.keepOriginalFormat) {
            return [this.file.rootExtension];
        }

        if (this.config.format) {
            return this.config.format;
        }

        return ['jpg'];
    }

    getResult(): ImageResult[] {
        if (!this.config.keepOriginalFile || this.results.some((result) => result.isOriginal)) {
            return this.results;
        }

        return [
            ...this.results,
            {
                name: this.file.local.key,
                dimension: { width: this.fileMetadata.width, height: this.fileMetadata.height },
                format: this.file.rootExtension,
                size: this.fileMetadata.size,
                isOriginal: true,
                type: 'image'
            }
        ];
    }
}
