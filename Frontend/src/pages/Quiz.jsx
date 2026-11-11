import React from 'react';
import { useSearchParams } from 'react-router-dom';
import QuizView from '../components/dashboard/QuizView';

/**
 * Quiz Page - AI Assessment & MCQ Practice Hub
 */
const Quiz = () => {
  const [searchParams] = useSearchParams();

  return (
    <QuizView initialSubject={searchParams.get('subject') || ''} />
  );
};

export default Quiz;
