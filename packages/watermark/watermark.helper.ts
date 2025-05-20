import { WatermarkOptions } from './type';
import sharp, { Sharp } from 'sharp';
import { Dimension, getNewDimension, makeUuid, scale } from '@hodfords/lfh-common';

export async function createWatermark(
    option: WatermarkOptions,
    dimension: Dimension,
    dirPath: string
): Promise<string> {
    const image = await getWatermark(option, dimension);
    const filePath = `${dirPath}/${makeUuid()}.png`;
    await image.png().toFile(filePath);

    return filePath;
}

export async function getWatermark(option: WatermarkOptions, dimension: Dimension): Promise<Sharp> {
    const image = sharp(option.image.path);
    const actualSize = await image.metadata();
    let size = {
        width: option.size.width ?? actualSize.width,
        height: option.size.height ?? actualSize.height
    };
    if (size.width > dimension.width || size.height > dimension.height) {
        size = getNewDimension(size, dimension);
    }

    if (option.size.scale) {
        size = getNewDimension(size, scale(dimension, option.size.scale));
    }
    image.resize(size);
    if (option.rotation) {
        image.rotate(option.rotation);
    }
    return image;
}
