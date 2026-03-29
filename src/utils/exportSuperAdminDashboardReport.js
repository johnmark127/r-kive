const escapeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return '""'
  }

  const normalized = String(value).replace(/"/g, '""')
  return `"${normalized}"`
}

export const exportSuperAdminDashboardReport = ({
  generatedAt,
  stats,
  researchStages,
  groupFilter,
  groups,
  adviserPerformance,
  activityLogs,
  mostViewedPapers
}) => {
  let csv = ''

  csv += 'Super Admin Dashboard Report\n'
  csv += `${escapeCsvValue('Generated At')},${escapeCsvValue(new Date(generatedAt).toLocaleString())}\n\n`

  csv += 'Dashboard Statistics\n'
  csv += 'Metric,Value\n'
  csv += `${escapeCsvValue('Total Students')},${escapeCsvValue(stats.totalStudents || 0)}\n`
  csv += `${escapeCsvValue('Total Advisers')},${escapeCsvValue(stats.totalAdvisers || 0)}\n`
  csv += `${escapeCsvValue('Total Groups')},${escapeCsvValue(stats.totalGroups || 0)}\n`
  csv += `${escapeCsvValue('Total Librarians')},${escapeCsvValue(stats.totalLibrarians || 0)}\n\n`

  csv += 'Research Stage Breakdown\n'
  csv += 'Stage,Count\n'
  csv += `${escapeCsvValue('Chapter 1')},${escapeCsvValue(researchStages.chapter1 || 0)}\n`
  csv += `${escapeCsvValue('Chapter 2')},${escapeCsvValue(researchStages.chapter2 || 0)}\n`
  csv += `${escapeCsvValue('Chapter 3')},${escapeCsvValue(researchStages.chapter3 || 0)}\n`
  csv += `${escapeCsvValue('Pre-Oral Defense')},${escapeCsvValue(researchStages.preOralDefense || 0)}\n`
  csv += `${escapeCsvValue('Final Defense')},${escapeCsvValue(researchStages.finalDefense || 0)}\n`
  csv += `${escapeCsvValue('Completed')},${escapeCsvValue(researchStages.completed || 0)}\n\n`

  csv += 'Groups Progress Snapshot\n'
  csv += `${escapeCsvValue('Applied Adviser Filter')},${escapeCsvValue(groupFilter === 'all' ? 'All Advisers' : groupFilter)}\n`
  csv += 'Group Name,Adviser,Progress,Stage,Completed Chapters,Last Updated\n'
  groups.forEach((group) => {
    csv += [
      escapeCsvValue(group.group),
      escapeCsvValue(group.adviser),
      escapeCsvValue(`${group.completion || 0}%`),
      escapeCsvValue(group.status || ''),
      escapeCsvValue(`${group.completedChapters || 0}/5`),
      escapeCsvValue(group.lastUpdated ? new Date(group.lastUpdated).toLocaleDateString() : '')
    ].join(',') + '\n'
  })
  csv += '\n'

  csv += 'Adviser Performance\n'
  csv += 'Adviser,Assigned Groups,Feedback Responses\n'
  adviserPerformance.forEach((adviser) => {
    csv += [
      escapeCsvValue(adviser.name),
      escapeCsvValue(adviser.groups || 0),
      escapeCsvValue(adviser.feedback || 0)
    ].join(',') + '\n'
  })
  csv += '\n'

  csv += 'Most Viewed Papers\n'
  csv += 'Title,Author,Department,Views\n'
  mostViewedPapers.forEach((paper) => {
    csv += [
      escapeCsvValue(paper.title),
      escapeCsvValue(paper.author),
      escapeCsvValue(paper.department),
      escapeCsvValue(paper.views || 0)
    ].join(',') + '\n'
  })
  csv += '\n'

  csv += 'Student Leader Activity Logs\n'
  csv += 'Leader,Activity,Time,Status\n'
  activityLogs.forEach((log) => {
    csv += [
      escapeCsvValue(log.leader),
      escapeCsvValue(log.activity),
      escapeCsvValue(log.time),
      escapeCsvValue(log.status)
    ].join(',') + '\n'
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `superadmin-dashboard-report-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
