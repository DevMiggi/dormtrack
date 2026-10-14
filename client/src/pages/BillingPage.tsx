import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useOutletContext } from 'react-router'
import { toApiError } from '../api/axios'
import { createBilling, deleteBilling, getBillings, updateBilling } from '../api/billings'
import { getOccupancies } from '../api/occupancies'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Dialog from '../components/ui/Dialog'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Input from '../components/ui/Input'
import LoadingState from '../components/ui/LoadingState'
import PageHeader from '../components/ui/PageHeader'
import Select from '../components/ui/Select'
import useApi from '../hooks/useApi'
import { billingSchema, calculateBillTotal, type BillingFormValues } from '../schemas/billingSchema'
import { BILL_STATUS_TONE, BILL_STATUSES, type Billing } from '../types/billing'
import type { LayoutContext } from '../types/layout'
import type { Occupancy } from '../types/occupancy'
import { formatBillingPeriod, formatDate, formatLabel, formatPeso, toDateInputValue } from '../utils/format'

type BillFormProps = {
  bill: Billing | null // null when creating a new bill
  occupancies: Occupancy[] // active occupancies to choose from (create only)
  onCancel: () => void
  onSaved: (bill: Billing) => void
}

function BillForm({ bill, occupancies, onCancel, onSaved }: BillFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BillingFormValues>({
    resolver: zodResolver(billingSchema),
    defaultValues: bill
      ? {
          occupancy: bill.occupancy._id,
          billingPeriod: bill.billingPeriod,
          dueDate: toDateInputValue(bill.dueDate),
          rentAmount: bill.rentAmount,
          utilityAmount: bill.utilityAmount,
          otherCharges: bill.otherCharges,
          discount: bill.discount,
        }
      : {
          occupancy: '',
          billingPeriod: toDateInputValue(new Date()).slice(0, 7), // this month, "YYYY-MM"
          dueDate: '',
          utilityAmount: 0,
          otherCharges: 0,
          discount: 0,
        },
  })

  // D10: once a payment is recorded, the amounts are locked. Only the due date can change.
  const amountsLocked = bill !== null && bill.totalPaid > 0

  // Live total preview (D8), computed during render from the values being typed.
  const [rentAmount, utilityAmount, otherCharges, discount] = useWatch({
    control,
    name: ['rentAmount', 'utilityAmount', 'otherCharges', 'discount'],
  })
  const amounts = [rentAmount, utilityAmount, otherCharges, discount]
  const previewTotal = amounts.every((value) => Number.isFinite(value))
    ? calculateBillTotal({ rentAmount, utilityAmount, otherCharges, discount })
    : null

  // D8: rent starts as the occupancy's agreed monthly rate. It can still be changed.
  function handleOccupancyChange(occupancyId: string) {
    const occupancy = occupancies.find((item) => item._id === occupancyId)
    if (occupancy) setValue('rentAmount', occupancy.agreedMonthlyRate, { shouldValidate: true })
  }

  async function onSubmit(values: BillingFormValues) {
    try {
      onSaved(bill ? await updateBilling(bill._id, values) : await createBilling(values))
    } catch (error) {
      // e.g. "A bill for this period already exists", or the D10 amount lock
      setError('root', { message: toApiError(error).message })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {bill ? (
        <div className="rounded-lg bg-surface px-3 py-2 text-sm">
          <p className="font-medium text-ink">
            {bill.tenant.fullName} · Room {bill.occupancy.room.roomNumber}
          </p>
          <p className="text-ink-muted">{formatBillingPeriod(bill.billingPeriod)} (tenant and month cannot change)</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Tenant and room"
            className="sm:col-span-2"
            {...register('occupancy', { onChange: (event) => handleOccupancyChange(event.target.value) })}
            error={errors.occupancy?.message}
          >
            <option value="">Choose an active occupancy</option>
            {occupancies.map((occupancy) => (
              <option key={occupancy._id} value={occupancy._id}>
                {occupancy.tenant.fullName} · Room {occupancy.room.roomNumber}
              </option>
            ))}
          </Select>
          <Input label="Billing month" type="month" {...register('billingPeriod')} error={errors.billingPeriod?.message} />
          <Input label="Due date" type="date" {...register('dueDate')} error={errors.dueDate?.message} />
        </div>
      )}

      {bill && <Input label="Due date" type="date" {...register('dueDate')} error={errors.dueDate?.message} />}

      {amountsLocked ? (
        <div className="rounded-lg border border-line p-3 text-sm">
          <p className="flex items-center gap-2 font-medium text-ink">
            <Lock className="size-4" aria-hidden="true" />
            Amounts are locked because a payment was recorded.
          </p>
          <p className="mt-1 text-ink-muted">
            Rent {formatPeso(bill.rentAmount)} · Utilities {formatPeso(bill.utilityAmount)} · Other{' '}
            {formatPeso(bill.otherCharges)} · Discount {formatPeso(bill.discount)}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Rent (₱)"
            type="number"
            min={0}
            step="0.01"
            {...register('rentAmount', { valueAsNumber: true })}
            error={errors.rentAmount?.message}
          />
          <Input
            label="Utilities (₱)"
            type="number"
            min={0}
            step="0.01"
            {...register('utilityAmount', { valueAsNumber: true })}
            error={errors.utilityAmount?.message}
          />
          <Input
            label="Other charges (₱)"
            type="number"
            min={0}
            step="0.01"
            {...register('otherCharges', { valueAsNumber: true })}
            error={errors.otherCharges?.message}
          />
          <Input
            label="Discount (₱)"
            type="number"
            min={0}
            step="0.01"
            {...register('discount', { valueAsNumber: true })}
            error={errors.discount?.message}
          />
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg bg-primary-light px-4 py-3">
        <span className="text-sm font-medium text-primary">Total</span>
        <span className={`text-lg font-semibold ${previewTotal !== null && previewTotal < 0 ? 'text-danger' : 'text-ink'}`}>
          {previewTotal === null ? '—' : formatPeso(previewTotal)}
        </span>
      </div>

      {errors.root && (
        <p role="alert" className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
          {errors.root.message}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : bill ? 'Save changes' : 'Create bill'}
        </Button>
      </div>
    </form>
  )
}

// Loads the active occupancies when the "New bill" dialog opens.
function CreateBillPanel({ onCancel, onSaved }: Pick<BillFormProps, 'onCancel' | 'onSaved'>) {
  const loadOccupancies = useCallback(() => getOccupancies({ status: 'active' }), [])
  const { data: occupancies, error, refetch } = useApi(loadOccupancies)

  if (error) return <ErrorState message={error.message} onRetry={refetch} />
  if (!occupancies) return <LoadingState label="Loading occupancies..." />
  if (occupancies.length === 0) {
    return <EmptyState title="No active occupancies" message="Bills can only be created for tenants who are assigned to a room." />
  }
  return <BillForm bill={null} occupancies={occupancies} onCancel={onCancel} onSaved={onSaved} />
}

type BillActionsProps = {
  bill: Billing
  onEdit: (bill: Billing) => void
  onDelete: (bill: Billing) => void
}

function BillActions({ bill, onEdit, onDelete }: BillActionsProps) {
  const label = `${bill.tenant.fullName}, ${formatBillingPeriod(bill.billingPeriod)}`
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" aria-label={`Edit bill for ${label}`} onClick={() => onEdit(bill)}>
        <Pencil className="size-4" aria-hidden="true" />
      </Button>
      <Button variant="ghost" size="sm" aria-label={`Delete bill for ${label}`} onClick={() => onDelete(bill)}>
        <Trash2 className="size-4 text-danger" aria-hidden="true" />
      </Button>
    </div>
  )
}

function StatusCell({ bill }: { bill: Billing }) {
  return (
    <>
      <Badge tone={BILL_STATUS_TONE[bill.status]}>{formatLabel(bill.status)}</Badge>
      {bill.daysOverdue > 0 && <p className="mt-1 text-xs text-danger">{bill.daysOverdue} days overdue</p>}
    </>
  )
}

// A table on medium screens and up, stacked cards on phones (§8).
function BillList({ bills, onEdit, onDelete }: { bills: Billing[] } & Omit<BillActionsProps, 'bill'>) {
  return (
    <>
      <Card padded={false} className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs font-medium tracking-wide text-ink-muted uppercase">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Period</th>
              <th className="hidden px-4 py-3 text-right lg:table-cell">Total</th>
              <th className="hidden px-4 py-3 text-right lg:table-cell">Paid</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {bills.map((bill) => (
              <tr key={bill._id}>
                <td className="px-4 py-3">
                  <Link to={`/tenants/${bill.tenant._id}`} className="font-semibold text-ink hover:text-primary">
                    {bill.tenant.fullName}
                  </Link>
                  <p className="text-xs text-ink-muted">Room {bill.occupancy.room.roomNumber}</p>
                </td>
                <td className="px-4 py-3">
                  {formatBillingPeriod(bill.billingPeriod)}
                  <p className="text-xs text-ink-muted">Due {formatDate(bill.dueDate)}</p>
                </td>
                <td className="hidden px-4 py-3 text-right lg:table-cell">{formatPeso(bill.total)}</td>
                <td className="hidden px-4 py-3 text-right lg:table-cell">{formatPeso(bill.totalPaid)}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatPeso(bill.remainingBalance)}</td>
                <td className="px-4 py-3">
                  <StatusCell bill={bill} />
                </td>
                <td className="px-4 py-3">
                  <BillActions bill={bill} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ul className="space-y-3 md:hidden">
        {bills.map((bill) => (
          <li key={bill._id}>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/tenants/${bill.tenant._id}`} className="font-semibold text-ink hover:text-primary">
                    {bill.tenant.fullName}
                  </Link>
                  <p className="text-xs text-ink-muted">
                    Room {bill.occupancy.room.roomNumber} · {formatBillingPeriod(bill.billingPeriod)} · Due{' '}
                    {formatDate(bill.dueDate)}
                  </p>
                </div>
                <div className="text-right">
                  <StatusCell bill={bill} />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-sm text-ink-muted">
                  {formatPeso(bill.totalPaid)} of {formatPeso(bill.total)} ·{' '}
                  <span className="font-semibold text-ink">{formatPeso(bill.remainingBalance)} left</span>
                </p>
                <BillActions bill={bill} onEdit={onEdit} onDelete={onDelete} />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}

function BillingPage() {
  const { showToast } = useOutletContext<LayoutContext>()
  const [billingPeriod, setBillingPeriod] = useState('')
  const [status, setStatus] = useState('')

  const loadBills = useCallback(() => getBillings({ billingPeriod, status }), [billingPeriod, status])
  const { data: bills, error, refetch } = useApi(loadBills)

  // The form dialog: null = closed, 'new' = creating, a bill = editing that bill.
  const [formBill, setFormBill] = useState<Billing | 'new' | null>(null)
  const [deletingBill, setDeletingBill] = useState<Billing | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const hasFilters = billingPeriod !== '' || status !== ''

  function handleSaved(bill: Billing) {
    const label = `${bill.tenant.fullName} (${formatBillingPeriod(bill.billingPeriod)})`
    showToast(formBill === 'new' ? `Bill created for ${label}` : `Bill updated for ${label}`)
    setFormBill(null)
    refetch()
  }

  function askToDelete(bill: Billing) {
    setDeleteError(null)
    setDeletingBill(bill)
  }

  async function confirmDelete() {
    if (!deletingBill) return
    setDeleting(true)
    try {
      await deleteBilling(deletingBill._id)
      showToast(`Bill deleted for ${deletingBill.tenant.fullName} (${formatBillingPeriod(deletingBill.billingPeriod)})`)
      setDeletingBill(null)
      refetch()
    } catch (error) {
      setDeleteError(toApiError(error).message) // D10: "A bill with payments cannot be deleted"
    } finally {
      setDeleting(false)
    }
  }

  let content
  if (error) {
    content = <ErrorState message={error.message} onRetry={refetch} />
  } else if (!bills) {
    content = <LoadingState label="Loading bills..." />
  } else if (bills.length === 0) {
    content = hasFilters ? (
      <EmptyState title="No bills match your filters" message="Try another month or status." />
    ) : (
      <EmptyState
        title="No bills yet"
        message="Create a monthly bill for a tenant who is assigned to a room."
        action={<Button onClick={() => setFormBill('new')}>New bill</Button>}
      />
    )
  } else {
    // A list total, computed during render.
    const listBalance = bills.reduce((sum, bill) => sum + bill.remainingBalance, 0)
    content = (
      <>
        <p className="mb-3 text-sm text-ink-muted">
          {bills.length} {bills.length === 1 ? 'bill' : 'bills'} · Balance due:{' '}
          <span className="font-semibold text-ink">{formatPeso(listBalance)}</span>
        </p>
        <BillList bills={bills} onEdit={setFormBill} onDelete={askToDelete} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Billing"
        description="Monthly bills with their balance and status."
        actions={
          <Button onClick={() => setFormBill('new')}>
            <Plus className="size-4" aria-hidden="true" />
            New bill
          </Button>
        }
      />

      <Card className="mb-4 grid gap-3 sm:grid-cols-3">
        <Input label="Billing month" type="month" value={billingPeriod} onChange={(event) => setBillingPeriod(event.target.value)} />
        <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {BILL_STATUSES.map((value) => (
            <option key={value} value={value}>
              {formatLabel(value)}
            </option>
          ))}
        </Select>
        {hasFilters && (
          <div className="flex items-end">
            <Button
              variant="ghost"
              onClick={() => {
                setBillingPeriod('')
                setStatus('')
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </Card>

      {content}

      <Dialog
        open={formBill !== null}
        title={formBill === 'new' ? 'New bill' : 'Edit bill'}
        onClose={() => setFormBill(null)}
      >
        {formBill === 'new' ? (
          <CreateBillPanel onCancel={() => setFormBill(null)} onSaved={handleSaved} />
        ) : (
          formBill && <BillForm bill={formBill} occupancies={[]} onCancel={() => setFormBill(null)} onSaved={handleSaved} />
        )}
      </Dialog>

      <ConfirmDialog
        open={deletingBill !== null}
        title="Delete this bill?"
        message="This permanently removes the bill. A bill with payments cannot be deleted."
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingBill(null)}
      />
    </>
  )
}

export default BillingPage
