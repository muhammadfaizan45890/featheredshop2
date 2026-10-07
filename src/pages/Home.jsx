




import React from 'react';
import Hero from '@/components/Hero';
import Category1 from '@/components/Category1';
import NewArrivals from '@/components/NewArrivals';
import Conditions from '@/components/Conditions';
// import HNews from '@/components/HNews';
// import LatestStories from '@/components/LatestStories';
// import FeaturedStories from './FeaturedStories';

const Home = () => {
  return (
    <div>
      {/* ─── Hero ────────────────────────────────────────── */}
      <Hero />
      <Category1/>
      <NewArrivals/>
      <Conditions/>

      {/* ─── Featured Stories ───────────────────────────── */}
      {/* <FeaturedStories /> */}

      {/* ─── Latest Stories ─────────────────────────────── */}
      {/* <LatestStories /> */}

      {/* ─── HNews ───────────────────────────────────────── */}
      {/* <HNews /> */}
    </div>
  );
};

export default Home;
