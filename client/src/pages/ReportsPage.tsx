import { BedDouble, ReceiptText, Timer, Wallet } from 'lucide-react'
import { useCallback, useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getMaintenanceReport, getOccupancyReport, getOutstandingReport, getRevenueReport } from '../api/reports'
import AvailabilityBar from '../components/ui/AvailabilityBar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ErrorState from '../components/ui/ErrorState'
import Input from '../components/ui/Input'
import LoadingState from '../components/ui/LoadingState'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import useApi from '../hooks/useApi'
import { BILL_STATUS_TONE } from '../types/billing'
import { PAYMENT_METHOD_LABEL } from '../types/payment'
import { formatBillingPeriod, formatDate, formatLabel, formatPercent, formatPeso } from '../utils/format'

// Chart colors come from the Tailwind theme (§8): pine marks, light grid, muted axis text.
const AXIS_TICK = { fill: 'var(--color-ink-muted)', fontSize: 12 }
const TOOLTIP_STYLE = { borderRadius: 8, border: '1px solid var(--color-line)', fontSize: 13 }

const compactPeso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', notation: 'compact' })

// "2026-08" -> "Aug 2026"
function shortMonth(period: string) {
  const [year, month] = period.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })
}

type BarDatum = { label: string; value: number }

type SimpleBarChartProps = {
  data: BarDatum[]
  valueName: string // shown in the tooltip, e.g. "Collected"
  formatValue: (value: number) => string
  formatTick?: (value: number) => string
  horizontal?: boolean // bars grow to the right; better for longer category names
}

// One series, one color, thin bars with rounded ends (dataviz mark specs).
// Animation is off so bars always appear at once (and nothing moves for people who prefer less motion).
function SimpleBarChart({ data, valueName, formatValue, formatTick = formatValue, horizontal = false }: SimpleBarChartProps) {
  const tooltip = (
    <Tooltip cursor={{ fill: 'var(--color-surface)' }} contentStyle={TOOLTIP_STYLE} formatter={(value) => [formatValue(Number(value)), valueName]} />
  )

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {horizontal ? (
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid horizontal={false} stroke="var(--color-line)" />
            <XAxis type="number" allowDecimals={false} tickFormatter={formatTick} tickLine={false} axisLine={false} tick={AXIS_TICK} />
            <YAxis type="category" dataKey="label" tickLine={false} axisLine={{ stroke: 'var(--color-line)' }} tick={AXIS_TICK} width={92} />
            {tooltip}
            <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive={false} />
          </BarChart>
        ) : (
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-line)" />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'var(--color-line)' }} tick={AXIS_TICK} interval={0} />
            <YAxis allowDecimals={false} tickFormatter={formatTick} tickLine={false} axisLine={false} tick={AXIS_TICK} width={56} />
            {tooltip}
            <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

type TableViewProps = {
  headers: string[]
  rows: { key: string; cells: ReactNode[] }[]
}

// Every chart has a table twin, so no value depends on hovering or on color.
function TableView({ headers, rows }: TableViewProps) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer font-medium text-primary">Show as table</summary>
      <table className="mt-2 w-full text-left">
        <thead className="text-xs text-ink-muted uppercase">
          <tr>
            {headers.map((header) => (
              <th key={header} className="py-1 pr-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, index) => (
                <td key={headers[index]} className="py-1.5 pr-3 tabular-nums">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}

type ReportSectionProps = {
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}

function ReportSection({ title, description, actions, children }: ReportSectionProps) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <p className="text-sm text-ink-muted">{description}</p>
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="min-w-0">
      <h3 className="mb-3 text-sm font-semibold text-ink">{title}</h3>
      {children}
    </Card>
  )
}

function RevenueSection() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const loadRevenue = useCallback(() => getRevenueReport({ from, to }), [from, to])
  const { data: report, error, refetch } = useApi(loadRevenue)

  let content
  if (error) {
    content = <ErrorState message={error.message} onRetry={refetch} />
  } else if (!report) {
    content = <LoadingState label="Loading revenue..." />
  } else {
    content = (
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Total collected"
          value={formatPeso(report.totalCollected)}
          hint={from || to ? 'In the chosen dates' : 'All payments so far'}
          icon={Wallet}
          tone="success"
        />
        <ChartCard title="Collected by month">
          {report.byMonth.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">No payments in these dates.</p>
          ) : (
            <>
              <SimpleBarChart
                data={report.byMonth.map((row) => ({ label: shortMonth(row.month), value: row.total }))}
                valueName="Collected"
                formatValue={formatPeso}
                formatTick={(value) => compactPeso.format(value)}
              />
              <TableView
                headers={['Month', 'Collected']}
                rows={report.byMonth.map((row) => ({ key: row.month, cells: [formatBillingPeriod(row.month), formatPeso(row.total)] }))}
              />
            </>
          )}
        </ChartCard>
        <ChartCard title="Collected by payment method">
          <SimpleBarChart
            data={report.byMethod.map((row) => ({ label: PAYMENT_METHOD_LABEL[row.method], value: row.total }))}
            valueName="Collected"
            formatValue={formatPeso}
            formatTick={(value) => compactPeso.format(value)}
            horizontal
          />
          <TableView
            headers={['Method', 'Payments', 'Collected']}
            rows={report.byMethod.map((row) => ({
              key: row.method,
              cells: [PAYMENT_METHOD_LABEL[row.method], row.count, formatPeso(row.total)],
            }))}
          />
        </ChartCard>
      </div>
    )
  }

  return (
    <ReportSection
      title="Revenue"
      description="Payments collected, by month and by method."
      actions={
        <div className="flex flex-wrap items-end gap-2">
          <Input label="From" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <Input label="To" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          {(from || to) && (
            <Button
              variant="ghost"
              onClick={() => {
                setFrom('')
                setTo('')
              }}
            >
              Clear
            </Button>
          )}
        </div>
      }
    >
      {content}
    </ReportSection>
  )
}

function OccupancySection() {
  const loadOccupancy = useCallback(() => getOccupancyReport(), [])
  const { data: report, error, refetch } = useApi(loadOccupancy)

  let content
  if (error) {
    content = <ErrorState message={error.message} onRetry={refetch} />
  } else if (!report) {
    content = <LoadingState label="Loading occupancy..." />
  } else {
    const byType = report.byRoomType.map((row) => ({
      label: formatLabel(row.roomType),
      occupied: row.activeOccupants,
      vacant: row.capacity - row.activeOccupants,
    }))
    content = (
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Overall occupancy"
          value={formatPercent(report.overallRate)}
          hint={`${report.totalOccupants} of ${report.totalCapacity} slots in active rooms`}
          icon={BedDouble}
        />
        <ChartCard title="Slots by room type">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-line)" />
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'var(--color-line)' }} tick={AXIS_TICK} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={AXIS_TICK} width={40} />
                <Tooltip cursor={{ fill: 'var(--color-surface)' }} contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
                {/* The white stroke leaves a 2px gap between the two stacked parts. */}
                <Bar dataKey="occupied" name="Occupied" stackId="slots" fill="var(--color-primary)" stroke="#ffffff" strokeWidth={2} maxBarSize={24} isAnimationActive={false} />
                <Bar dataKey="vacant" name="Vacant" stackId="slots" fill="var(--color-line)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <TableView
            headers={['Type', 'Rooms', 'Occupied', 'Capacity', 'Rate']}
            rows={report.byRoomType.map((row) => ({
              key: row.roomType,
              cells: [formatLabel(row.roomType), row.rooms, row.activeOccupants, row.capacity, formatPercent(row.occupancyRate)],
            }))}
          />
        </ChartCard>
        <ChartCard title="Each active room">
          <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {report.rooms.map((room) => (
              <li key={room._id}>
                <p className="text-sm font-medium text-ink">
                  Room {room.roomNumber} <span className="font-normal text-ink-muted">· {formatPercent(room.occupancyRate)}</span>
                </p>
                <AvailabilityBar occupied={room.activeOccupants} capacity={room.capacity} />
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>
    )
  }

  return (
    <ReportSection title="Occupancy" description="How full the active rooms are right now.">
      {content}
    </ReportSection>
  )
}

function MaintenanceSection() {
  const loadMaintenance = useCallback(() => getMaintenanceReport(), [])
  const { data: report, error, refetch } = useApi(loadMaintenance)

  let content
  if (error) {
    content = <ErrorState message={error.message} onRetry={refetch} />
  } else if (!report) {
    content = <LoadingState label="Loading maintenance..." />
  } else {
    content = (
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Average days to resolve"
          value={report.averageResolutionDays === null ? 'None yet' : `${report.averageResolutionDays} days`}
          hint={`Over ${report.resolvedCount} resolved ${report.resolvedCount === 1 ? 'request' : 'requests'}`}
          icon={Timer}
        />
        <ChartCard title="Requests by status">
          <SimpleBarChart
            data={report.byStatus.map((row) => ({ label: formatLabel(row.status), value: row.count }))}
            valueName="Requests"
            formatValue={String}
            horizontal
          />
          <TableView
            headers={['Status', 'Requests']}
            rows={report.byStatus.map((row) => ({ key: row.status, cells: [formatLabel(row.status), row.count] }))}
          />
        </ChartCard>
        <ChartCard title="Requests by priority">
          <SimpleBarChart
            data={report.byPriority.map((row) => ({ label: formatLabel(row.priority), value: row.count }))}
            valueName="Requests"
            formatValue={String}
          />
          <TableView
            headers={['Priority', 'Requests']}
            rows={report.byPriority.map((row) => ({ key: row.priority, cells: [formatLabel(row.priority), row.count] }))}
          />
        </ChartCard>
      </div>
    )
  }

  return (
    <ReportSection title="Maintenance" description="Requests by status and priority, and how long fixes take.">
      {content}
    </ReportSection>
  )
}

function OutstandingSection() {
  const loadOutstanding = useCallback(() => getOutstandingReport(), [])
  const { data: report, error, refetch } = useApi(loadOutstanding)

  let content
  if (error) {
    content = <ErrorState message={error.message} onRetry={refetch} />
  } else if (!report) {
    content = <LoadingState label="Loading outstanding balances..." />
  } else {
    content = (
      <>
        <div className="mb-4 grid gap-4 lg:grid-cols-3">
          <StatCard
            label="Total outstanding"
            value={formatPeso(report.totalOutstanding)}
            hint={`${report.bills.length} ${report.bills.length === 1 ? 'bill' : 'bills'} with a balance`}
            icon={ReceiptText}
            tone="warning"
          />
        </div>
        {report.bills.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-ink-muted">Every bill is fully paid.</p>
          </Card>
        ) : (
          <>
            {/* A table on medium screens and up, stacked cards on phones (§8). */}
            <Card padded={false} className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs font-medium tracking-wide text-ink-muted uppercase">
                  <tr>
                    <th className="px-4 py-3">Tenant</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="hidden px-4 py-3 lg:table-cell">Due</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {report.bills.map((bill) => (
                    <tr key={bill._id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{bill.tenantName}</p>
                        <p className="text-xs text-ink-muted">Room {bill.roomNumber}</p>
                      </td>
                      <td className="px-4 py-3">{formatBillingPeriod(bill.billingPeriod)}</td>
                      <td className="hidden px-4 py-3 lg:table-cell">{formatDate(bill.dueDate)}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatPeso(bill.remainingBalance)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={BILL_STATUS_TONE[bill.status]}>{formatLabel(bill.status)}</Badge>
                        {bill.daysOverdue > 0 && <p className="mt-1 text-xs text-danger">{bill.daysOverdue} days overdue</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <ul className="space-y-3 md:hidden">
              {report.bills.map((bill) => (
                <li key={bill._id}>
                  <Card>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{bill.tenantName}</p>
                        <p className="text-xs text-ink-muted">
                          Room {bill.roomNumber} · {formatBillingPeriod(bill.billingPeriod)}
                        </p>
                      </div>
                      <p className="font-semibold text-ink">{formatPeso(bill.remainingBalance)}</p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge tone={BILL_STATUS_TONE[bill.status]}>{formatLabel(bill.status)}</Badge>
                      {bill.daysOverdue > 0 && <span className="text-xs text-danger">{bill.daysOverdue} days overdue</span>}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </>
        )}
      </>
    )
  }

  return (
    <ReportSection title="Outstanding balances" description="Every bill with money still owed, most overdue first.">
      {content}
    </ReportSection>
  )
}

function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports" description="Revenue, occupancy, maintenance and outstanding balances." />
      <RevenueSection />
      <OccupancySection />
      <MaintenanceSection />
      <OutstandingSection />
    </>
  )
}

export default ReportsPage
