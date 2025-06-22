import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY fehlt in den Umgebungsvariablen');
}

const DEFAULT_PARAMS = {
    api_key: TMDB_API_KEY,
    language: 'de-DE',
    include_adult: false,
};

const tmdbRequest = async (endpoint, params = {}) => {
    const url = `${TMDB_BASE_URL}${endpoint}`;
    const mergedParams = { ...DEFAULT_PARAMS, ...params };
    const response = await axios.get(url, { params: mergedParams });
    return response.data;
};

export const searchMovie = async (query) => {
    return tmdbRequest('/search/movie', { query, include_adult: true });
};

export const searchTv = async (query) => {
    return tmdbRequest('/search/tv', { query, include_adult: true });
};

export const getMovieDetails = async (id) => {
    return tmdbRequest(`/movie/${id}`);
};

export const getTvDetails = async (id) => {
    return tmdbRequest(`/tv/${id}`);
};

export const getSeasonEpisodes = async (tvId, seasonNumber) => {
    const data = await tmdbRequest(`/tv/${tvId}/season/${seasonNumber}`);
    return data.episodes || [];
};

export const getImageUrl = (path, size = 'w500') => {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/${size}${path}`;
};
