import HotRightNow from '../components/Hot_today';
import PopularTracks from '../components/Popular_tracks';
import '../styles.css'; 
export default function Home() {
  return (
    <>
      <div className="content__top">
        <h1 className="content__top-header">Music</h1>
      </div>
      <HotRightNow />
      <PopularTracks />
    </>
  );
}