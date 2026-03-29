const escapeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return '""'
  }

  const normalized = String(value).replace(/"/g, '""')
  return `"${normalized}"`
}

const toIsoDate = (date) => {
  if (!date) return ''
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().slice(0, 10)
}

const toFilenameDate = (date, fallback) => {
  const iso = toIsoDate(date)
  return iso || fallback
}

export const exportSuperAdminAdviserReport = ({
  generatedAt,
  filterLabel,
  startDate,
  endDate,
  selectedAdviserName,
  performanceMetrics,
  advisers
}) => {
  const fromDate = toFilenameDate(startDate, 'start')
  const toDate = toFilenameDate(endDate, 'end')
  let csv = ''

  csv += 'Super Admin Adviser Performance Report\n'
  csv += `${escapeCsvValue('Generated At')},${escapeCsvValue(new Date(generatedAt).toLocaleString())}\n`
  csv += `${escapeCsvValue('Date Range')},${escapeCsvValue(filterLabel)}\n`
  csv += `${escapeCsvValue('Start Date')},${escapeCsvValue(toIsoDate(startDate))}\n`
  csv += `${escapeCsvValue('End Date')},${escapeCsvValue(toIsoDate(endDate))}\n`
  csv += `${escapeCsvValue('Adviser Filter')},${escapeCsvValue(selectedAdviserName)}\n\n`

  csv += 'Summary\n'
  csv += 'Metric,Value\n'
  csv += `${escapeCsvValue('Advisers Included')},${escapeCsvValue(performanceMetrics.totalAdvisers || 0)}\n`
  csv += `${escapeCsvValue('Groups Assigned')},${escapeCsvValue(performanceMetrics.groupsAssigned || 0)}\n`
  csv += `${escapeCsvValue('Feedback Given')},${escapeCsvValue(performanceMetrics.feedbackGiven || 0)}\n`
  csv += `${escapeCsvValue('Annotations')},${escapeCsvValue(performanceMetrics.annotationCount || 0)}\n`
  csv += `${escapeCsvValue('Average Group Progress')},${escapeCsvValue(`${performanceMetrics.averageGroupProgress || 0}%`)}\n\n`

  csv += 'Adviser Summary\n'
  csv += 'Name,Email,Status,Last Active,Assigned Groups,Active Projects,Completed Projects,Average Group Progress,Feedback Count,Annotation Count,Resolved Annotations,Weekly Activity Score,Monthly Activity Score\n'

  advisers.forEach((adviser) => {
    csv += [
      escapeCsvValue(adviser.name),
      escapeCsvValue(adviser.email),
      escapeCsvValue(adviser.status),
      escapeCsvValue(adviser.lastActive),
      escapeCsvValue(adviser.assignedGroups || 0),
      escapeCsvValue(adviser.activeProjects || 0),
      escapeCsvValue(adviser.completedProjects || 0),
      escapeCsvValue(`${adviser.averageGroupProgress || 0}%`),
      escapeCsvValue(adviser.feedbackCount || 0),
      escapeCsvValue(adviser.annotationCount || 0),
      escapeCsvValue(adviser.resolvedAnnotations || 0),
      escapeCsvValue(Math.round(adviser.weeklyActivityScore || 0)),
      escapeCsvValue(Math.round(adviser.monthlyActivityScore || 0))
    ].join(',') + '\n'
  })

  csv += '\nHandled Group Progress\n'
  csv += 'Adviser,Group Name,Project Title,Progress,Status,Is Active,Assigned At,Last Updated\n'

  advisers.forEach((adviser) => {
    const handledGroups = adviser.handledGroups || []

    if (handledGroups.length === 0) {
      csv += [
        escapeCsvValue(adviser.name),
        escapeCsvValue('No assigned groups'),
        escapeCsvValue(''),
        escapeCsvValue('0%'),
        escapeCsvValue(''),
        escapeCsvValue(''),
        escapeCsvValue(''),
        escapeCsvValue('')
      ].join(',') + '\n'
      return
    }

    handledGroups.forEach((group) => {
      csv += [
        escapeCsvValue(adviser.name),
        escapeCsvValue(group.groupName),
        escapeCsvValue(group.projectTitle),
        escapeCsvValue(`${group.progress || 0}%`),
        escapeCsvValue(group.status || 'unstarted'),
        escapeCsvValue(group.isActive ? 'Yes' : 'No'),
        escapeCsvValue(group.assignedAt ? new Date(group.assignedAt).toLocaleDateString() : ''),
        escapeCsvValue(group.lastUpdated ? new Date(group.lastUpdated).toLocaleDateString() : '')
      ].join(',') + '\n'
    })
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `superadmin-adviser-report-${fromDate}-to-${toDate}.csv`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
