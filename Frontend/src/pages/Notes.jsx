import React from 'react';
import { useOutletContext } from 'react-router-dom';
import NotesView from '../components/dashboard/NotesView';

/**
 * Notes Page - Study Materials & Documents Vault
 */
const Notes = () => {
  const { onSelectTab, onOpenDocumentViewer } = useOutletContext();

  return (
    <NotesView 
      onSelectTab={onSelectTab} 
      onOpenDocumentViewer={onOpenDocumentViewer} 
    />
  );
};

export default Notes;

