import { Dimension, FileDetail } from '@hodfords/lfh-common';
import { WatermarkOptions } from '@hodfords/lfh-watermark';

export type Config = {
    dimensions: Dimension[];
    allowMimeType: string[];
    format?: string[];
    keepOriginalFormat?: boolean;
    keepOriginalFile?: boolean;
    thumbnailDimension: Dimension;
    thumbnailTimemark?: string;
    thumbnailFormat?: string;
    vcodec?: string;
    acodec?: string;
    watermark?: WatermarkOptions;
};

export type VideoResult = FileDetail & {
    dimension: Dimension;
    duration: number;
    type: 'video';
};

export type ImageResult = FileDetail & {
    dimension: Dimension;
    type: 'image';
};
