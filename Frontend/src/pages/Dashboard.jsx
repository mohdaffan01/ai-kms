import React from 'react';
import { useOutletContext } from 'react-router-dom';
import DashboardOverview from '../components/dashboard/DashboardOverview';

/**
 * Dashboard Page - Overview of learning progress, subjects, and study metrics
 */
const Dashboard = () => {
  const { onSelectTab, onOpenDocumentViewer } = useOutletContext();

  return (
    <DashboardOverview 
      onSelectTab={onSelectTab} 
      onOpenDocumentViewer={onOpenDocumentViewer} 
    />
  );
};

export default Dashboard;
