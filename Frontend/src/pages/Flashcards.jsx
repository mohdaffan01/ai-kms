import React from 'react';
import { useSearchParams } from 'react-router-dom';
import FlashcardsView from '../components/dashboard/FlashcardsView';

/**
 * Flashcards Page - Interactive Revision Deck & Spaced Repetition
 */
const Flashcards = () => {
  const [searchParams] = useSearchParams();

  return (
    <FlashcardsView initialSubject={searchParams.get('subject') || ''} />
  );
};

export default Flashcards;
