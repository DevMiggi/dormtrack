import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useOutletContext } from 'react-router'
import { toApiError } from '../api/axios'
import { getBillings } from '../api/billings'
import { createPayment, deletePayment, getPayments } from '../api/payments'
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
import Textarea from '../components/ui/Textarea'
import useApi from '../hooks/useApi'
import { paymentSchema, type PaymentFormValues } from '../schemas/paymentSchema'
import { BILL_STATUS_TONE, type Billing } from '../types/billing'
import type { LayoutContext } from '../types/layout'
import { PAYMENT_METHOD_LABEL, PAYMENT_METHODS, type Payment } from '../types/payment'
import { formatBillingPeriod, formatDate, formatLabel, formatPeso, toDateInputValue } from '../utils/format'

type PaymentFormProps = {
  bills: Billing[] // bills that still have a balance
  onCancel: () => void
  onSaved: (result: { payment: Payment; billing: Billing }) => void
}

function PaymentForm({ bills, onCancel, onSaved }: PaymentFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      billing: '',
      paymentDate: toDateInputValue(new Date()),
      method: 'cash',
      referenceNumber: '',
      notes: '',
    },
  })

  // §7: show the remaining balance before saving. Computed during render from the chosen bill.
  const [billingId, amount] = useWatch({ control, name: ['billing', 'amount'] })
  const selectedBill = bills.find((bill) => bill._id === billingId)
  const balanceAfter = selectedBill && Number.isFinite(amount) ? selectedBill.remainingBalance - amount : null

  async function onSubmit(values: PaymentFormValues) {
    try {
      onSaved(await createPayment(values))
    } catch (error) {
      // D11, e.g. "Amount cannot exceed the remaining balance of ₱1,380.00"
      setError('root', { message: toApiError(error).message })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Select label="Bill" {...register('billing')} error={errors.billing?.message}>
        <option value="">Choose a bill with a balance</option>
        {bills.map((bill) => (
          <option key={bill._id} value={bill._id}>
            {bill.tenant.fullName} · {formatBillingPeriod(bill.billingPeriod)} · {formatPeso(bill.remainingBalance)} left
          </option>
        ))}
      </Select>

      {selectedBill && (
        <div className="rounded-lg bg-primary-light px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-primary">Remaining balance</span>
            <span className="text-lg font-semibold text-ink">{formatPeso(selectedBill.remainingBalance)}</span>
          </div>
          <p className="mt-1 text-ink-muted">
            Room {selectedBill.occupancy.room.roomNumber} · Total {formatPeso(selectedBill.total)} · Paid{' '}
            {formatPeso(selectedBill.totalPaid)} · <Badge tone={BILL_STATUS_TONE[selectedBill.status]}>{formatLabel(selectedBill.status)}</Badge>
          </p>
          {balanceAfter !== null &&
            (balanceAfter < 0 ? (
              <p className="mt-1 font-medium text-danger">This is more than the remaining balance.</p>
            ) : (
              <p className="mt-1 text-ink">After this payment: {formatPeso(balanceAfter)} left</p>
            ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Input
            label="Amount (₱)"
            type="number"
            min={0.01}
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            error={errors.amount?.message}
          />
          {selectedBill && (
            <button
              type="button"
              className="mt-1 text-xs font-medium text-primary hover:underline"
              onClick={() => setValue('amount', selectedBill.remainingBalance, { shouldValidate: true })}
            >
              Pay the full balance
            </button>
          )}
        </div>
        <Input label="Payment date" type="date" {...register('paymentDate')} error={errors.paymentDate?.message} />
        <Select label="Method" {...register('method')} error={errors.method?.message}>
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {PAYMENT_METHOD_LABEL[method]}
            </option>
          ))}
        </Select>
        <Input label="Reference number (optional)" placeholder="e.g. GCash ref" {...register('referenceNumber')} error={errors.referenceNumber?.message} />
      </div>
      <Textarea label="Notes (optional)" rows={2} {...register('notes')} error={errors.notes?.message} />

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
          {isSubmitting ? 'Saving...' : 'Record payment'}
        </Button>
      </div>
    </form>
  )
}

// Loads the bills that still have a balance when the dialog opens.
function RecordPaymentPanel({ onCancel, onSaved }: Omit<PaymentFormProps, 'bills'>) {
  const loadBills = useCallback(() => getBillings(), [])
  const { data: bills, error, refetch } = useApi(loadBills)

  if (error) return <ErrorState message={error.message} onRetry={refetch} />
  if (!bills) return <LoadingState label="Loading bills..." />

  // Only bills with something left to pay, sorted by tenant name (D11: fully paid bills take no payments).
  const openBills = bills
    .filter((bill) => bill.remainingBalance > 0)
    .sort((a, b) => a.tenant.fullName.localeCompare(b.tenant.fullName))

  if (openBills.length === 0) {
    return <EmptyState title="Every bill is fully paid" message="There is nothing left to collect right now." />
  }
  return <PaymentForm bills={openBills} onCancel={onCancel} onSaved={onSaved} />
}

// A table on medium screens and up, stacked cards on phones (§8).
function PaymentList({ payments, onDelete }: { payments: Payment[]; onDelete: (payment: Payment) => void }) {
  return (
    <>
      <Card padded={false} className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs font-medium tracking-wide text-ink-muted uppercase">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Method</th>
              <th className="hidden px-4 py-3 lg:table-cell">Reference</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {payments.map((payment) => (
              <tr key={payment._id}>
                <td className="px-4 py-3">{formatDate(payment.paymentDate)}</td>
                <td className="px-4 py-3">
                  <Link to={`/tenants/${payment.tenant._id}`} className="font-semibold text-ink hover:text-primary">
                    {payment.tenant.fullName}
                  </Link>
                  <p className="text-xs text-ink-muted">Bill for {formatBillingPeriod(payment.billing.billingPeriod)}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone="primary">{PAYMENT_METHOD_LABEL[payment.method]}</Badge>
                </td>
                <td className="hidden px-4 py-3 text-ink-muted lg:table-cell">{payment.referenceNumber || '—'}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatPeso(payment.amount)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" aria-label={`Delete payment of ${formatPeso(payment.amount)} from ${payment.tenant.fullName}`} onClick={() => onDelete(payment)}>
                      <Trash2 className="size-4 text-danger" aria-hidden="true" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ul className="space-y-3 md:hidden">
        {payments.map((payment) => (
          <li key={payment._id}>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/tenants/${payment.tenant._id}`} className="font-semibold text-ink hover:text-primary">
                    {payment.tenant.fullName}
                  </Link>
                  <p className="text-xs text-ink-muted">
                    {formatDate(payment.paymentDate)} · Bill for {formatBillingPeriod(payment.billing.billingPeriod)}
                  </p>
                </div>
                <p className="font-semibold text-ink">{formatPeso(payment.amount)}</p>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-sm text-ink-muted">
                  <Badge tone="primary">{PAYMENT_METHOD_LABEL[payment.method]}</Badge> {payment.referenceNumber}
                </p>
                <Button variant="ghost" size="sm" aria-label={`Delete payment of ${formatPeso(payment.amount)} from ${payment.tenant.fullName}`} onClick={() => onDelete(payment)}>
                  <Trash2 className="size-4 text-danger" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}

function PaymentsPage() {
  const { showToast } = useOutletContext<LayoutContext>()
  const [method, setMethod] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const loadPayments = useCallback(() => getPayments({ method, from, to }), [method, from, to])
  const { data: payments, error, refetch } = useApi(loadPayments)

  const [recordOpen, setRecordOpen] = useState(false)
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const hasFilters = method !== '' || from !== '' || to !== ''

  function handleRecorded({ payment, billing }: { payment: Payment; billing: Billing }) {
    showToast(
      `${formatPeso(payment.amount)} recorded for ${payment.tenant.fullName}. ${formatPeso(billing.remainingBalance)} left on the bill.`
    )
    setRecordOpen(false)
    refetch()
  }

  function askToDelete(payment: Payment) {
    setDeleteError(null)
    setDeletingPayment(payment)
  }

  async function confirmDelete() {
    if (!deletingPayment) return
    setDeleting(true)
    try {
      await deletePayment(deletingPayment._id)
      showToast(`Payment of ${formatPeso(deletingPayment.amount)} from ${deletingPayment.tenant.fullName} deleted`)
      setDeletingPayment(null)
      refetch()
    } catch (error) {
      setDeleteError(toApiError(error).message)
    } finally {
      setDeleting(false)
    }
  }

  let content
  if (error) {
    content = <ErrorState message={error.message} onRetry={refetch} />
  } else if (!payments) {
    content = <LoadingState label="Loading payments..." />
  } else if (payments.length === 0) {
    content = hasFilters ? (
      <EmptyState title="No payments match your filters" message="Try another method or date range." />
    ) : (
      <EmptyState
        title="No payments yet"
        message="Record a payment against a bill to start the history."
        action={<Button onClick={() => setRecordOpen(true)}>Record payment</Button>}
      />
    )
  } else {
    // A list total, computed during render.
    const listTotal = payments.reduce((sum, payment) => sum + payment.amount, 0)
    content = (
      <>
        <p className="mb-3 text-sm text-ink-muted">
          {payments.length} {payments.length === 1 ? 'payment' : 'payments'} · Collected:{' '}
          <span className="font-semibold text-ink">{formatPeso(listTotal)}</span>
        </p>
        <PaymentList payments={payments} onDelete={askToDelete} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Payments"
        description="Payment history. A wrong payment is deleted and recorded again."
        actions={
          <Button onClick={() => setRecordOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Record payment
          </Button>
        }
      />

      <Card className="mb-4 grid gap-3 sm:grid-cols-3">
        <Select label="Method" value={method} onChange={(event) => setMethod(event.target.value)}>
          <option value="">All methods</option>
          {PAYMENT_METHODS.map((value) => (
            <option key={value} value={value}>
              {PAYMENT_METHOD_LABEL[value]}
            </option>
          ))}
        </Select>
        <Input label="From" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <Input label="To" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
      </Card>

      {content}

      <Dialog open={recordOpen} title="Record payment" onClose={() => setRecordOpen(false)}>
        <RecordPaymentPanel onCancel={() => setRecordOpen(false)} onSaved={handleRecorded} />
      </Dialog>

      <ConfirmDialog
        open={deletingPayment !== null}
        title="Delete this payment?"
        message={
          deletingPayment
            ? `${formatPeso(deletingPayment.amount)} from ${deletingPayment.tenant.fullName} will be removed and the bill's balance goes back up. To fix a wrong payment, delete it and record it again.`
            : ''
        }
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingPayment(null)}
      />
    </>
  )
}

export default PaymentsPage
