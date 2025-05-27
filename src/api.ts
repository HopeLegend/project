const API_KEY = '6e81a7d82c8ffc507bb2bcfc1f45ddc0'; // ← Замени на свой ключ!
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

/**
 * Получает список топ-артистов.
 * @returns Массив популярных исполнителей.
 */
export async function fetchTopArtists() {
  const url = `${BASE_URL}?method=chart.gettopartists&api_key=${API_KEY}&format=json&limit=12`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.artists.artist;
  } catch (error) {
    console.error('Ошибка при получении артистов:', error);
    return [];
  }
}

/**
 * Поиск треков по запросу.
 * @param query Поисковый запрос (например, название песни).
 * @returns Массив найденных треков.
 */
export async function fetchTracksByQuery(query: string) {
  const url = `${BASE_URL}?method=track.search&track=${encodeURIComponent(query)}&api_key=${API_KEY}&format=json&limit=10`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.results.trackmatches.track;
  } catch (error) {
    console.error('Ошибка при поиске треков:', error);
    return [];
  }
}
