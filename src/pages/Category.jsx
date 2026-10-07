// Category.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import News from './Shop'; // reuse the News component

const Category = () => {
  const { name } = useParams();
  // Pass category as a prop to News, or let News read the URL
  // Since News reads from URL, we can just redirect to /news?category=...
  // But if you want a separate page, you can modify News to accept a category prop.
  return <News initialCategory={name} />;
};