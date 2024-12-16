import { FileDetail } from '@hodfords/lfh-common';

export type Config = {
    allowMimeType: string[];
    format?: string[];
    keepOriginalFormat?: boolean;
    keepOriginalFile?: boolean;
};

export type AudioResult = FileDetail & {
    duration: number;
    type: 'audio';
};
