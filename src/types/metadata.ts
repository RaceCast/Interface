/**
 * Metadata object
 */
export interface Metadata {
    name: string;
    link: string;
    stages: Stage[];
    car: Car;
}

/**
 * Stage object
 */
export interface Stage {
    name: string;
    time: string;
}

export interface Car {
    tech: Array<string>;
    signal: number;
    longitude: number;
    latitude: number;
    altitude: number;
    speed: number;
    last_update: number;
}