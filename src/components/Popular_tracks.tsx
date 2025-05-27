import { useEffect, useState } from 'react';
import { fetchPopularTracks, getTrackTags, TrackData, TagInfo } from '../api/lastfm';

export default function PopularTracks() {
  const [tracks, setTracks] = useState<TrackData[]>([]);

  useEffect(() => {
    fetchPopularTracks()
      .then(setTracks)
      .catch(console.error);
  }, []);

  const cols: TrackData[][] = [[], [], []];
  tracks.forEach((track, idx) => cols[idx % 3].push(track));

  return (
    <section className="popular-tracks">
      <h2 className="popular-tracks__title">Popular tracks</h2>
      <div className="popular-tracks__underline"></div>
      <div className="popular-tracks__columns">
        {cols.map((col, i) => (
          <div key={i} className="popular-tracks__col">
            {col.map(track => (
              <TrackItem key={track.name} track={track} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function TrackItem({ track }: { track: TrackData }) {
  const [tags, setTags] = useState<TagInfo[]>([]);

  useEffect(() => {
    getTrackTags(track.artist.name, track.name)
      .then(setTags)
      .catch(() => {});
  }, [track]);

  return (
    <div className="popular-tracks__item">
      <a href={track.url} className="popular-tracks__media">
        <img
          className="popular-tracks__thumb"
          src={track.image?.[2]?.['#text']}
          alt={track.name}
          loading="lazy"
        />
      </a>
      <div className="popular-tracks__info">
        <a href={track.url} className="popular-tracks__track">
          {track.name}
        </a>
        <a href={track.artist.url} className="popular-tracks__artist">
          {track.artist.name}
        </a>
        {tags.length > 0 && (
          <p className="popular-tracks__tags">
            {tags.map(t => (
              <a key={t.name} href={t.url} className="popular-tracks__tag">
                {t.name}
              </a>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}