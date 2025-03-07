import { ProjectId, UnixTime } from '@l2beat/shared-pure'

import { AggregateReportRecord } from '../../peripherals/database/AggregateReportRepository'
import { ReportRecord } from '../../peripherals/database/ReportRepository'
import { ReportProject } from './ReportProject'

export interface Category {
  projectId: ProjectId
  check: (project: ReportProject) => boolean
}

const DEFAULT_CATEGORIES: Category[] = [
  {
    projectId: ProjectId.ALL,
    check: () => true,
  },
  {
    projectId: ProjectId.BRIDGES,
    check: (project) => project.type === 'bridge',
  },
  {
    projectId: ProjectId.LAYER2S,
    check: (project) => project.type === 'layer2',
  },
]

export function aggregateReports(
  reports: ReportRecord[],
  projects: ReportProject[],
  timestamp: UnixTime,
): AggregateReportRecord[] {
  return aggregateReportsWithCategories(
    reports,
    projects,
    DEFAULT_CATEGORIES,
    timestamp,
  )
}

export function aggregateReportsWithCategories(
  reports: ReportRecord[],
  projects: ReportProject[],
  categories: Category[],
  timestamp: UnixTime,
): AggregateReportRecord[] {
  const categorized = categories.map(({ projectId }) => ({
    timestamp,
    projectId,
    tvlEth: 0n,
    tvlUsd: 0n,
  }))
  const aggregateReports: AggregateReportRecord[] = []

  for (const project of projects) {
    const filteredReports = reports.filter(
      (x) => x.projectId === project.projectId,
    )
    const { tvlEth, tvlUsd } = filteredReports.reduce(
      (acc, next) => ({
        tvlUsd: acc.tvlUsd + next.balanceUsd,
        tvlEth: acc.tvlEth + next.balanceEth,
      }),
      { tvlUsd: 0n, tvlEth: 0n },
    )
    for (const [i, { check }] of categories.entries()) {
      if (check(project)) {
        categorized[i].tvlEth += tvlEth
        categorized[i].tvlUsd += tvlUsd
      }
    }
    aggregateReports.push({
      timestamp,
      projectId: project.projectId,
      tvlEth,
      tvlUsd,
    })
  }

  aggregateReports.push(...categorized)

  return aggregateReports
}
