export type WatermarkOptions = {
    rotation: number;
    position: 'northwest' | 'north' | 'northeast' | 'west' | 'center' | 'east' | 'southwest' | 'south' | 'southeast';
    size: {
        width?: number;
        height?: number;
        scale?: `${number}%`; // Percentage to original image
    };
    image: {
        path: string;
    };
};
