import { BedDouble, CircleAlert, DoorOpen, ReceiptText, Wallet, Wrench } from 'lucide-react'
import { useCallback, type ReactNode } from 'react'
import { Link } from 'react-router'
import { getOverdueBillings } from '../api/billings'
import { getDashboardSummary } from '../api/dashboard'
import { getMaintenanceRequests } from '../api/maintenanceRequests'
import AvailabilityBar from '../components/ui/AvailabilityBar'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import ErrorState from '../components/ui/ErrorState'
import LoadingState from '../components/ui/LoadingState'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import useApi from '../hooks/useApi'
import {
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_PRIORITY_TONE,
  MAINTENANCE_STATUS_TONE,
  type MaintenanceRequest,
} from '../types/maintenance'
import { formatBillingPeriod, formatDate, formatLabel, formatPercent, formatPeso } from '../utils/format'

const LIST_LIMIT = 5 // how many overdue bills and open requests the dashboard shows

type PanelProps = {
  title: string
  linkTo: string
  linkLabel: string
  children: ReactNode
}

function Panel({ title, linkTo, linkLabel, children }: PanelProps) {
  return (
    <Card className="flex flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <Link to={linkTo} className="text-sm font-medium text-primary hover:underline">
          {linkLabel}
        </Link>
      </div>
      {children}
    </Card>
  )
}

function EmptyLine({ children }: { children: string }) {
  return <p className="py-6 text-center text-sm text-ink-muted">{children}</p>
}

// Urgent first, then high, medium, low; newest report first within a priority.
function byPriority(a: MaintenanceRequest, b: MaintenanceRequest) {
  const rank = MAINTENANCE_PRIORITIES.indexOf(b.priority) - MAINTENANCE_PRIORITIES.indexOf(a.priority)
  return rank !== 0 ? rank : b.dateReported.localeCompare(a.dateReported)
}

function DashboardPage() {
  const loadDashboard = useCallback(async () => {
    const [summary, overdueBills, requests] = await Promise.all([
      getDashboardSummary(),
      getOverdueBillings(),
      getMaintenanceRequests(),
    ])
    return { summary, overdueBills, requests }
  }, [])
  const { data, error, refetch } = useApi(loadDashboard)

  if (error) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <ErrorState message={error.message} onRetry={refetch} />
      </>
    )
  }
  if (!data) return <LoadingState label="Loading dashboard..." />

  const { summary, overdueBills, requests } = data
  // Derived during render: "open" means open or in progress (D15), most urgent first.
  const openRequests = requests.filter((request) => request.status === 'open' || request.status === 'in_progress').sort(byPriority)

  return (
    <>
      <PageHeader title="Dashboard" description="Rooms, money and maintenance at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Occupancy rate"
          value={formatPercent(summary.occupancyRate)}
          hint={`${summary.occupiedSlots} of ${summary.totalCapacity} slots filled in ${summary.totalRooms} active rooms`}
          icon={BedDouble}
        />
        <StatCard label="Vacant slots" value={summary.vacantSlots} hint="Free beds in active rooms" icon={DoorOpen} tone="success" />
        <StatCard
          label="Collected this month"
          value={formatPeso(summary.collectionsThisMonth)}
          hint="Payments dated this month"
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Total outstanding"
          value={formatPeso(summary.totalOutstanding)}
          hint="Unpaid balances on all bills"
          icon={ReceiptText}
          tone="warning"
        />
        <StatCard
          label="Overdue bills"
          value={summary.overdueCount}
          hint="Past due with a balance left"
          icon={CircleAlert}
          tone={summary.overdueCount > 0 ? 'danger' : 'success'}
        />
        <StatCard
          label="Open maintenance"
          value={summary.openMaintenance.total}
          hint={`${summary.openMaintenance.urgent} urgent`}
          icon={Wrench}
          tone={summary.openMaintenance.urgent > 0 ? 'danger' : 'warning'}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Rooms near capacity" linkTo="/rooms" linkLabel="All rooms">
          {summary.roomsNearCapacity.length === 0 ? (
            <EmptyLine>No active room is 75% full or more with a free slot.</EmptyLine>
          ) : (
            <ul className="space-y-4">
              {summary.roomsNearCapacity.map((room) => (
                <li key={room._id}>
                  <Link to={`/rooms/${room._id}`} className="text-sm font-medium text-ink hover:text-primary">
                    Room {room.roomNumber} · {formatLabel(room.roomType)}
                  </Link>
                  <div className="mt-1">
                    <AvailabilityBar occupied={room.activeOccupants} capacity={room.capacity} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Overdue bills" linkTo="/billing" linkLabel="All bills">
          {overdueBills.length === 0 ? (
            <EmptyLine>No overdue bills.</EmptyLine>
          ) : (
            <ul className="divide-y divide-line">
              {overdueBills.slice(0, LIST_LIMIT).map((bill) => (
                <li key={bill._id} className="flex items-start justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link to={`/tenants/${bill.tenant._id}`} className="text-sm font-medium text-ink hover:text-primary">
                      {bill.tenant.fullName}
                    </Link>
                    <p className="text-xs text-ink-muted">
                      Room {bill.occupancy.room.roomNumber} · {formatBillingPeriod(bill.billingPeriod)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">{formatPeso(bill.remainingBalance)}</p>
                    <p className="text-xs text-danger">{bill.daysOverdue} days overdue</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Open maintenance" linkTo="/maintenance" linkLabel="All requests">
          {openRequests.length === 0 ? (
            <EmptyLine>No open maintenance requests.</EmptyLine>
          ) : (
            <ul className="divide-y divide-line">
              {openRequests.slice(0, LIST_LIMIT).map((request) => (
                <li key={request._id} className="py-2 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-ink">{request.description}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <span>
                      Room {request.room.roomNumber} · {formatDate(request.dateReported)}
                    </span>
                    <Badge tone={MAINTENANCE_PRIORITY_TONE[request.priority]}>{formatLabel(request.priority)}</Badge>
                    <Badge tone={MAINTENANCE_STATUS_TONE[request.status]}>{formatLabel(request.status)}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}

export default DashboardPage
