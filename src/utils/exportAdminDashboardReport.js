// Utility to export dashboard report as CSV
export function exportAdminDashboardReport({ stats, mostViewedPapers, recentActivities, analytics7, analytics30, analytics180 }) {
  let csv = '';
  // Stats section
  csv += 'Dashboard Statistics\n';
  csv += 'Title,Value\n';
  stats.forEach(stat => {
    csv += `"${stat.title}","${stat.value}"\n`;
  });
  csv += '\n';

  // Paper Views Analytics
  csv += 'Paper Views (Last 7 Days)\n';
  if (analytics7 && analytics7.length) {
    csv += 'Day,Views\n';
    analytics7.forEach(row => {
      csv += `"${row.day}",${row.views}\n`;
    });
  }
  csv += '\n';
  csv += 'Paper Views (Last 1 Month)\n';
  if (analytics30 && analytics30.length) {
    csv += 'Week,Views\n';
    analytics30.forEach(row => {
      csv += `"${row.week}",${row.views}\n`;
    });
  }
  csv += '\n';
  csv += 'Paper Views (Last 6 Months)\n';
  if (analytics180 && analytics180.length) {
    csv += 'Month,Views\n';
    analytics180.forEach(row => {
      csv += `"${row.month}",${row.views}\n`;
    });
  }
  csv += '\n';

  // Most Viewed Papers section
  csv += 'Most Viewed Papers\n';
  csv += 'Title,Authors,Unique Views\n';
  mostViewedPapers.forEach(paper => {
    csv += `"${paper.title}","${paper.authors}",${paper.uniqueViews}\n`;
  });
  csv += '\n';

  // Recent Activities section
  csv += 'Recent Activities\n';
  csv += 'Type,Description,Time\n';
  recentActivities.forEach(activity => {
    csv += `"${activity.type}","${activity.description}","${new Date(activity.timestamp).toLocaleString()}"\n`;
  });

  // Download as CSV
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `admin-dashboard-report-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
