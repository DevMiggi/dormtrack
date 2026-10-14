import { ArrowLeft, BedDouble, CircleAlert, ReceiptText, SearchX } from 'lucide-react'
import { useCallback } from 'react'
import { Link, useParams } from 'react-router'
import { getTenant } from '../api/tenants'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import LoadingState from '../components/ui/LoadingState'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import useApi from '../hooks/useApi'
import { BILL_STATUS_TONE, type TenantBill } from '../types/billing'
import { OCCUPANCY_STATUS_TONE } from '../types/occupancy'
import { TENANT_STATUS_TONE, type TenantDetails } from '../types/tenant'
import { formatBillingPeriod, formatDate, formatLabel, formatPeso } from '../utils/format'

function BackLink() {
  return (
    <Link to="/tenants" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" />
      All tenants
    </Link>
  )
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mb-3 text-base font-semibold text-ink">{children}</h2>
}

function ContactInfo({ tenant }: { tenant: TenantDetails }) {
  const rows = [
    { label: 'Phone', value: tenant.phone },
    { label: 'Email', value: tenant.email ?? 'None' },
    { label: 'Address', value: tenant.address || 'None' },
    { label: 'Emergency contact', value: `${tenant.emergencyContactName} (${tenant.emergencyContactPhone})` },
  ]
  return (
    <Card>
      <SectionTitle>Contact</SectionTitle>
      <dl className="space-y-3 text-sm">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-ink-muted">{row.label}</dt>
            <dd className="break-words font-medium text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

function CurrentRoom({ tenant }: { tenant: TenantDetails }) {
  const occupancy = tenant.currentOccupancy
  return (
    <Card>
      <SectionTitle>Current room</SectionTitle>
      {occupancy ? (
        <div className="text-sm">
          <Link to={`/rooms/${occupancy.room._id}`} className="text-lg font-semibold text-ink hover:text-primary">
            Room {occupancy.room.roomNumber}
          </Link>
          <p className="text-ink-muted">
            {occupancy.room.floor}
            {occupancy.bedLabel ? ` · ${occupancy.bedLabel}` : ''}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-ink-muted">Moved in</dt>
              <dd className="font-medium text-ink">{formatDate(occupancy.moveInDate)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Agreed rate</dt>
              <dd className="font-medium text-ink">{formatPeso(occupancy.agreedMonthlyRate)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Deposit</dt>
              <dd className="font-medium text-ink">{formatPeso(occupancy.depositAmount)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Expected move-out</dt>
              <dd className="font-medium text-ink">
                {occupancy.expectedMoveOutDate ? formatDate(occupancy.expectedMoveOutDate) : 'Not set'}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="text-sm text-ink-muted">Not assigned to a room right now.</p>
      )}
    </Card>
  )
}

// A table on medium screens and up, stacked cards on phones (§8).
function Bills({ bills, totalOutstanding }: { bills: TenantBill[]; totalOutstanding: number }) {
  return (
    <Card padded={false}>
      <div className="flex items-center justify-between gap-2 px-5 pt-5">
        <SectionTitle>Bills</SectionTitle>
        <p className="mb-3 text-sm text-ink-muted">
          Outstanding: <span className="font-semibold text-ink">{formatPeso(totalOutstanding)}</span>
        </p>
      </div>
      {bills.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-ink-muted">No bills yet.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-line text-xs font-medium tracking-wide text-ink-muted uppercase">
                <tr>
                  <th className="px-5 py-3">Period</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-right">Paid</th>
                  <th className="px-5 py-3 text-right">Balance</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {bills.map((bill) => (
                  <tr key={bill._id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">{formatBillingPeriod(bill.billingPeriod)}</p>
                      <p className="text-xs text-ink-muted">
                        Room {bill.occupancy.room.roomNumber} · Due {formatDate(bill.dueDate)}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-right">{formatPeso(bill.total)}</td>
                    <td className="px-5 py-3 text-right">{formatPeso(bill.totalPaid)}</td>
                    <td className="px-5 py-3 text-right font-semibold">{formatPeso(bill.remainingBalance)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={BILL_STATUS_TONE[bill.status]}>{formatLabel(bill.status)}</Badge>
                      {bill.daysOverdue > 0 && <p className="mt-1 text-xs text-danger">{bill.daysOverdue} days overdue</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-line border-t border-line md:hidden">
            {bills.map((bill) => (
              <li key={bill._id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{formatBillingPeriod(bill.billingPeriod)}</p>
                    <p className="text-xs text-ink-muted">Due {formatDate(bill.dueDate)}</p>
                  </div>
                  <Badge tone={BILL_STATUS_TONE[bill.status]}>{formatLabel(bill.status)}</Badge>
                </div>
                <p className="mt-2 text-sm text-ink-muted">
                  {formatPeso(bill.totalPaid)} paid of {formatPeso(bill.total)} ·{' '}
                  <span className="font-semibold text-ink">{formatPeso(bill.remainingBalance)} left</span>
                </p>
                {bill.daysOverdue > 0 && <p className="text-xs text-danger">{bill.daysOverdue} days overdue</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}

function OccupancyHistory({ tenant }: { tenant: TenantDetails }) {
  return (
    <Card>
      <SectionTitle>Occupancy history</SectionTitle>
      {tenant.occupancyHistory.length === 0 ? (
        <p className="text-sm text-ink-muted">This tenant has not been assigned to a room yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {tenant.occupancyHistory.map((occupancy) => (
            <li key={occupancy._id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <Link to={`/rooms/${occupancy.room._id}`} className="font-medium text-ink hover:text-primary">
                  Room {occupancy.room.roomNumber}
                </Link>
                <p className="text-xs text-ink-muted">
                  {formatDate(occupancy.moveInDate)} to{' '}
                  {occupancy.actualMoveOutDate ? formatDate(occupancy.actualMoveOutDate) : 'present'}
                </p>
              </div>
              <Badge tone={OCCUPANCY_STATUS_TONE[occupancy.status]}>{formatLabel(occupancy.status)}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function TenantDetailsPage() {
  const { id = '' } = useParams()
  const loadTenant = useCallback(() => getTenant(id), [id])
  const { data: tenant, error, refetch } = useApi(loadTenant)

  // §8: a clear "not found" state when the API answers 404.
  if (error?.status === 404) {
    return (
      <>
        <BackLink />
        <EmptyState
          icon={SearchX}
          title="Tenant not found"
          message="There is no tenant with this ID. They may have been deleted."
          action={
            <Link to="/tenants" className="text-sm font-medium text-primary hover:underline">
              Back to all tenants
            </Link>
          }
        />
      </>
    )
  }
  if (error) {
    return (
      <>
        <BackLink />
        <ErrorState message={error.message} onRetry={refetch} />
      </>
    )
  }
  if (!tenant) return <LoadingState label="Loading tenant..." />

  // Derived during render, never stored in state.
  const overdueBills = tenant.bills.filter((bill) => bill.status === 'overdue').length

  return (
    <>
      <BackLink />
      <PageHeader
        title={tenant.fullName}
        description={tenant.phone}
        actions={<Badge tone={TENANT_STATUS_TONE[tenant.status]}>{formatLabel(tenant.status)}</Badge>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Current room"
          value={tenant.currentOccupancy ? `Room ${tenant.currentOccupancy.room.roomNumber}` : 'None'}
          icon={BedDouble}
        />
        <StatCard
          label="Total outstanding"
          value={formatPeso(tenant.totalOutstanding)}
          icon={ReceiptText}
          tone={tenant.totalOutstanding > 0 ? 'warning' : 'success'}
        />
        <StatCard label="Overdue bills" value={overdueBills} icon={CircleAlert} tone={overdueBills > 0 ? 'danger' : 'success'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <ContactInfo tenant={tenant} />
          <CurrentRoom tenant={tenant} />
        </div>
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Bills bills={tenant.bills} totalOutstanding={tenant.totalOutstanding} />
          <OccupancyHistory tenant={tenant} />
        </div>
      </div>
    </>
  )
}

export default TenantDetailsPage
