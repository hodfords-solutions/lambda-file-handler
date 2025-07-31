import { Dimension } from '../type';

export function getNewDimension(imageSize: Dimension, desiredSize: Dimension): Dimension {
    // switch the axis if the image is in portrait mode and the desired size is in landscape mode
    if (imageSize.width < imageSize.height && desiredSize.width > desiredSize.height) {
        desiredSize = { width: desiredSize.height, height: desiredSize.width };
    }

    let xAxis = imageSize.width;
    let yAxis = imageSize.height;

    // if the image is larger than the desired size, resize it
    // if the image is in landscape mode, set the width to the desired size and calculate the height
    // if the image is in portrait mode, set the height to the desired size and calculate the width
    if (imageSize.width > desiredSize.width || imageSize.height > desiredSize.height) {
        if (imageSize.width > imageSize.height) {
            xAxis = desiredSize.width;
            yAxis = Math.round((desiredSize.width / imageSize.width) * imageSize.height);
        } else {
            yAxis = desiredSize.height;
            xAxis = Math.round((desiredSize.height / imageSize.height) * imageSize.width);
        }
    }

    return { width: makeEven(xAxis), height: makeEven(yAxis) };
}

export function makeEven(num: number): number {
    return Math.round(num / 2) * 2;
}

export function scale(size: Dimension, scaleSize: `${number}%`): Dimension {
    const scale = parseInt(scaleSize) / 100;
    return {
        width: Math.round(size.width * scale),
        height: Math.round(size.height * scale)
    };
}
