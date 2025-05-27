import React, { useEffect, useState } from 'react';
import {
  searchArtists,
  searchAlbums,
  searchTracks,
  getTrackMetadata,
  ArtistData,
  AlbumData,
  TrackData,
  TrackMetadata
} from '../api/lastfm';

type FullTrack = TrackData & TrackMetadata;

export default function SearchResults() {
  const [artists, setArtists] = useState<ArtistData[]>([]);
  const [albums, setAlbums] = useState<AlbumData[]>([]);
  const [tracks, setTracks] = useState<FullTrack[]>([]);
  const [loading, setLoading] = useState(true);

  const query = new URLSearchParams(window.location.search)
    .get('q')
    ?.trim() || '';

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }
    Promise.all([
      searchArtists(query),
      searchAlbums(query),
      searchTracks(query)
    ])
      .then(async ([a, b, c]) => {
        setArtists(a);
        setAlbums(b);
        const infos = await Promise.all(
          c.map(t =>
            getTrackMetadata(
              t.artist,
              t.name,
              t.image?.[1]?.['#text'] || '/images/image.png'
            ).then(info => ({ ...t, ...info }))
          )
        );
        setTracks(infos);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <section className="search-results">
        <div className="search-results__header-tabs">
        <header className="search-results__header">
          <h1 className={`search-results__title ${query ? 'is-visible' : ''}`}>
            Search results for “{query}”
          </h1>
        </header>
        <nav className="search-results__tabs">
          <ul className="search-results__tabs-list">
            <li className="search-results__tab search-results__tab--active">
              <span className="search-results__tab-link">Top Results</span>
            </li>
            <li className="search-results__tab">
              <span className="search-results__tab-link">Artists</span>
            </li>
            <li className="search-results__tab">
              <span className="search-results__tab-link">Albums</span>
            </li>
            <li className="search-results__tab">
              <span className="search-results__tab-link">Tracks</span>
            </li>
          </ul>
        </nav>
      </div>
      <div className="search-results__form">
        <form action="/search" method="get" className="search-results__form-inner">
          <input
            type="text"
            name="q"
            defaultValue=""
            placeholder="Search for music..."
            aria-label="Search"
            className="search-results__input"
          />
          <button
            type="reset"
            className="search-results__btn search-results__btn--clear"
            aria-label="Clear search input"
          >
            ×
          </button>
          <button
            type="submit"
            className="search-results__btn search-results__btn--submit"
            aria-label="Submit search"
          />
        </form>
      </div>
      <div className={`search-results__body ${query ? 'is-visible' : ''}`}>
        {!loading && (
          <>
            <ArtistsGrid artists={artists} />
            <AlbumsGrid albums={albums} />
            <TrackList tracks={tracks} />
          </>
        )}
      </div>
    </section>
  );
}

function ArtistsGrid({ artists }: { artists: ArtistData[] }) {
  return (
    <section className="artists">
      <h2 className="artists__title">Artists</h2>
      {artists.length > 0 ? (
        <div className="artists__grid">
          {artists.map((a, i) => (
            <a
              key={`${a.name}-${i}`}
              href={a.url}
              className="artists__item"
              style={{ backgroundImage: `url(${a.image?.[2]?.['#text']})` }}
            >
              <div className="artists__info">
                <h3 className="artists__name">{a.name}</h3>
                <p className="artists__listeners">
                  {Number(a.listeners).toLocaleString()} listeners
                </p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="artists__empty">No artists found.</p>
      )}
      <p className="artists__more">More artists →</p>
    </section>
  );
}

function AlbumsGrid({ albums }: { albums: AlbumData[] }) {
  return (
    <section className="albums">
      <h2 className="albums__title">Albums</h2>
      {albums.length > 0 ? (
        <div className="albums__grid">
          {albums.map((alb, i) => (
            <a
              key={`${alb.name}-${i}`}
              href={alb.url}
              className="albums__item"
              style={{ backgroundImage: `url(${alb.image?.[2]?.['#text']})` }}
            >
              <div className="albums__info">
                <h3 className="albums__name">{alb.name}</h3>
                <p className="albums__artist">{alb.artist}</p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="albums__empty">No albums found.</p>
      )}
      <p className="albums__more">More albums →</p>
    </section>
  );
}

function TrackList({ tracks }: { tracks: FullTrack[] }) {
  return (
    <section className="tracks">
      <h2 className="tracks__title">Tracks</h2>
      {tracks.length > 0 ? (
        <ul className="tracks__list">
          {tracks.map((t, i) => (
            <li key={`${t.name}-${i}`} className="tracks__item">
              <button className="tracks__play-btn" aria-label="Play" />
              <img
                className="tracks__image"
                src={t.imageUrl}
                alt={t.name}
              />
              <a href={t.url} className="tracks__name">
                {t.name}
              </a>
              <a href={t.artistUrl} className="tracks__artist">
                {t.artist}
              </a>
              <div className="tracks__duration">{t.duration}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="tracks__empty">No tracks found.</p>
      )}
      <p className="tracks__more">More tracks →</p>
    </section>
  );
}