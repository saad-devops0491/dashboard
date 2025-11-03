import React from 'react';
import { ThemeProvider } from '../hooks/useTheme';
import DashboardLayout from './Dashboard/DashboardLayout';

const Dashboard: React.FC = () => {
  return (
    <ThemeProvider>
      <DashboardLayout />
    </ThemeProvider>
  );
};

export default Dashboard;