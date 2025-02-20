const mapBoxToken = import.meta.env.VITE_MAPBOX_API_KEY!;

export const getMapBoxToken = (): string => {
    return mapBoxToken;
};