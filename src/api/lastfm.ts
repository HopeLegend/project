export const LASTFM_API_KEY = 'e2c5939f6232a96c047626af6f3c9b50';
export const API_ENDPOINT = 'https://ws.audioscrobbler.com/2.0/';

type ApiParams = Record<string, string | number>;

/**
 * Выполняет запрос к Last.fm API
 * @template T Ожидаемый тип ответа
 * @param {string} method Метод API
 * @param {ApiParams} [params={}] Параметры запроса
 * @returns {Promise<T>} Ответ API
 * @throws {Error} При ошибке сети или невалидном ответе
 */
async function fetchApiData<T>(method: string, params: ApiParams = {}): Promise<T> {
  const url = new URL(API_ENDPOINT);
  const config = { method, api_key: LASTFM_API_KEY, format: 'json', ...params };
  
  Object.entries(config)
    .filter(([, value]) => value !== undefined)
    .forEach(([key, value]) => 
      url.searchParams.set(key, value.toString())
    );

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
}

// Типы данных
export interface ImageData {
  size: string;
  '#text': string;
}

export interface TagInfo {
  url: string;
  name: string;
}

export interface ArtistData {
  name: string;
  mbid: string;
  url: string;
  listeners?: string;
  image: ImageData[];
}

export interface AlbumData {
  name: string;
  mbid?: string;
  url: string;
  artist: string;
  image: ImageData[];
}

export interface TrackData {
  name: string;
  mbid?: string;
  url: string;
  artist: any;
  image: ImageData[];
}

export interface TrackMetadata {
  duration: string;
  artistUrl: string;
  imageUrl: string;
}

// Методы для главной страницы
/**
 * Получает популярных исполнителей
 * @param {number} [limit=12] Лимит результатов
 * @returns {Promise<ArtistData[]>} Список исполнителей
 */
export const fetchPopularArtists = async (limit = 12): Promise<ArtistData[]> => {
  const { artists } = await fetchApiData<{ artists: { artist: ArtistData[] } }>(
    'chart.gettopartists',
    { limit }
  );
  return artists?.artist || [];
};

/**
 * Получает популярные треки
 * @param {number} [limit=18] Лимит результатов
 * @returns {Promise<TrackData[]>} Список треков
 */
export const fetchPopularTracks = async (limit = 18): Promise<TrackData[]> => {
  const { tracks } = await fetchApiData<{ tracks: { track: TrackData[] } }>(
    'chart.gettoptracks',
    { limit }
  );
  return tracks?.track || [];
};

/**
 * Получает теги для исполнителя
 * @param {string} artistName Имя исполнителя
 * @param {number} [maxTags=3] Максимум тегов
 * @returns {Promise<TagInfo[]>} Список тегов
 */
export const getArtistTags = async (
  artistName: string,
  maxTags = 3
): Promise<TagInfo[]> => {
  try {
    const { toptags } = await fetchApiData<{ toptags: { tag: TagInfo[] } }>(
      'artist.gettoptags',
      { artist: artistName }
    );
    return (toptags?.tag || []).filter(t => t.url).slice(0, maxTags);
  } catch {
    return [];
  }
};

/**
 * Получает теги для трека
 * @param {string} artistName Имя исполнителя
 * @param {string} trackName Название трека
 * @param {number} [maxTags=3] Максимум тегов
 * @returns {Promise<TagInfo[]>} Список тегов
 */
export const getTrackTags = async (
  artistName: string,
  trackName: string,
  maxTags = 3
): Promise<TagInfo[]> => {
  try {
    const { toptags } = await fetchApiData<{ toptags: { tag: TagInfo[] } }>(
      'track.gettoptags',
      { artist: artistName, track: trackName }
    );
    return (toptags?.tag || []).filter(t => t.url).slice(0, maxTags);
  } catch {
    return [];
  }
};

// Методы для страницы поиска
/**
 * Ищет исполнителей
 * @param {string} searchTerm Поисковый запрос
 * @param {number} [limit=8] Лимит результатов
 * @returns {Promise<ArtistData[]>} Список исполнителей
 */
export const searchArtists = async (
  searchTerm: string,
  limit = 8
): Promise<ArtistData[]> => {
  const { results } = await fetchApiData<{ results: { artistmatches: { artist: ArtistData[] } } }>(
    'artist.search',
    { artist: searchTerm, limit }
  );
  return results?.artistmatches?.artist || [];
};

/**
 * Ищет альбомы
 * @param {string} searchTerm Поисковый запрос
 * @param {number} [limit=8] Лимит результатов
 * @returns {Promise<AlbumData[]>} Список альбомов
 */
export const searchAlbums = async (
  searchTerm: string,
  limit = 8
): Promise<AlbumData[]> => {
  const { results } = await fetchApiData<{ results: { albummatches: { album: AlbumData[] } } }>(
    'album.search',
    { album: searchTerm, limit }
  );
  return results?.albummatches?.album || [];
};

/**
 * Ищет треки
 * @param {string} searchTerm Поисковый запрос
 * @param {number} [limit=10] Лимит результатов
 * @returns {Promise<TrackData[]>} Список треков
 */
export const searchTracks = async (
  searchTerm: string,
  limit = 10
): Promise<TrackData[]> => {
  const { results } = await fetchApiData<{ results: { trackmatches: { track: TrackData[] } } }>(
    'track.search',
    { track: searchTerm, limit }
  );
  return results?.trackmatches?.track || [];
};

/**
 * Получает метаданные трека
 * @param {string} artistName Имя исполнителя
 * @param {string} trackName Название трека
 * @param {string} defaultImage URL изображения по умолчанию
 * @returns {Promise<TrackMetadata>} Метаданные трека
 */
export const getTrackMetadata = async (
  artistName: string,
  trackName: string,
  defaultImage: string
): Promise<TrackMetadata> => {
  try {
    const { track } = await fetchApiData<{ track: any }>(
      'track.getInfo',
      { artist: artistName, track: trackName }
    );

    const duration = track?.duration 
      ? `${Math.floor(track.duration / 60000)}:${(track.duration % 60000 / 1000).toFixed(0).padStart(2, '0')}`
      : '';

    return {
      duration,
      artistUrl: track?.artist?.url || '#',
      imageUrl: track?.album?.image?.find((i: ImageData) => i.size === 'medium')?.['#text'] 
        || track?.album?.image?.[0]?.['#text'] 
        || defaultImage
    };
  } catch {
    return { duration: '', artistUrl: '#', imageUrl: defaultImage };
  }
};