import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useOutletContext } from 'react-router'
import { toApiError } from '../api/axios'
import { cancelOccupancy, completeOccupancy, createOccupancy, getOccupancies } from '../api/occupancies'
import { getRoomsAvailability } from '../api/rooms'
import { getTenants } from '../api/tenants'
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
import { assignSchema, moveOutSchema, type AssignFormValues, type MoveOutFormValues } from '../schemas/occupancySchema'
import type { LayoutContext } from '../types/layout'
import { OCCUPANCY_STATUS_TONE, OCCUPANCY_STATUSES, type Occupancy } from '../types/occupancy'
import type { Room } from '../types/room'
import type { Tenant } from '../types/tenant'
import { formatDate, formatLabel, formatPeso, toDateInputValue } from '../utils/format'

function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
      {message}
    </p>
  )
}

type AssignFormProps = {
  tenants: Tenant[]
  rooms: Room[]
  onCancel: () => void
  onSaved: (occupancy: Occupancy) => void
}

function AssignForm({ tenants, rooms, onCancel, onSaved }: AssignFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      tenant: '',
      room: '',
      moveInDate: toDateInputValue(new Date()),
      expectedMoveOutDate: '',
      bedLabel: '',
      depositAmount: 0,
      notes: '',
    },
  })

  // D4: the agreed rate starts as the chosen room's monthly rate. It can still be changed.
  function handleRoomChange(roomId: string) {
    const room = rooms.find((item) => item._id === roomId)
    if (room) setValue('agreedMonthlyRate', room.monthlyRate, { shouldValidate: true })
  }

  async function onSubmit(values: AssignFormValues) {
    try {
      onSaved(await createOccupancy(values))
    } catch (error) {
      // D4 rules from the server, e.g. "Room 203 is full (4 of 4 slots taken)"
      setError('root', { message: toApiError(error).message })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Select label="Tenant" {...register('tenant')} error={errors.tenant?.message}>
        <option value="">Choose a tenant</option>
        {tenants.map((tenant) => (
          <option key={tenant._id} value={tenant._id}>
            {tenant.fullName}
          </option>
        ))}
      </Select>
      <Select
        label="Room (only rooms with a free slot)"
        {...register('room', { onChange: (event) => handleRoomChange(event.target.value) })}
        error={errors.room?.message}
      >
        <option value="">Choose a room</option>
        {rooms.map((room) => (
          <option key={room._id} value={room._id}>
            Room {room.roomNumber} · {formatLabel(room.roomType)} · {room.availableSlots} free · {formatPeso(room.monthlyRate)}
          </option>
        ))}
      </Select>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Move-in date" type="date" {...register('moveInDate')} error={errors.moveInDate?.message} />
        <Input
          label="Expected move-out (optional)"
          type="date"
          {...register('expectedMoveOutDate')}
          error={errors.expectedMoveOutDate?.message}
        />
        <Input
          label="Agreed monthly rate (₱)"
          type="number"
          min={0}
          step="0.01"
          {...register('agreedMonthlyRate', { valueAsNumber: true })}
          error={errors.agreedMonthlyRate?.message}
        />
        <Input
          label="Deposit (₱)"
          type="number"
          min={0}
          step="0.01"
          {...register('depositAmount', { valueAsNumber: true })}
          error={errors.depositAmount?.message}
        />
      </div>
      <Input label="Bed label (optional)" placeholder="e.g. Bed A" {...register('bedLabel')} error={errors.bedLabel?.message} />
      <Textarea label="Notes (optional)" {...register('notes')} error={errors.notes?.message} />

      <FormError message={errors.root?.message} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Assigning...' : 'Assign tenant'}
        </Button>
      </div>
    </form>
  )
}

// Loads the choices for the assign form when the dialog opens.
function AssignPanel({ onCancel, onSaved }: Omit<AssignFormProps, 'tenants' | 'rooms'>) {
  const loadChoices = useCallback(async () => {
    const [tenants, activeOccupancies, rooms] = await Promise.all([
      getTenants({ status: 'active' }),
      getOccupancies({ status: 'active' }),
      getRoomsAvailability(),
    ])
    return { tenants, activeOccupancies, rooms }
  }, [])
  const { data, error, refetch } = useApi(loadChoices)

  if (error) return <ErrorState message={error.message} onRetry={refetch} />
  if (!data) return <LoadingState label="Loading tenants and rooms..." />

  // Offer only active tenants who have no room yet, and only rooms with a free slot (D3, D4, §7).
  const assignedTenantIds = new Set(data.activeOccupancies.map((occupancy) => occupancy.tenant._id))
  const freeTenants = data.tenants.filter((tenant) => !assignedTenantIds.has(tenant._id))
  const availableRooms = data.rooms.filter((room) => room.isAvailable)

  if (freeTenants.length === 0) {
    return <EmptyState title="Every active tenant has a room" message="Add a tenant first, or move someone out." />
  }
  if (availableRooms.length === 0) {
    return <EmptyState title="No room has a free slot" message="Every active room is full right now." />
  }
  return <AssignForm tenants={freeTenants} rooms={availableRooms} onCancel={onCancel} onSaved={onSaved} />
}

type MoveOutFormProps = {
  occupancy: Occupancy
  onCancel: () => void
  onSaved: (occupancy: Occupancy) => void
}

function MoveOutForm({ occupancy, onCancel, onSaved }: MoveOutFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MoveOutFormValues>({
    resolver: zodResolver(moveOutSchema),
    defaultValues: { actualMoveOutDate: toDateInputValue(new Date()) },
  })

  async function onSubmit(values: MoveOutFormValues) {
    try {
      onSaved(await completeOccupancy(occupancy._id, values.actualMoveOutDate))
    } catch (error) {
      setError('root', { message: toApiError(error).message }) // e.g. "actualMoveOutDate cannot be before moveInDate"
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <p className="text-sm text-ink-muted">
        {occupancy.tenant.fullName} moves out of Room {occupancy.room.roomNumber}. They moved in on{' '}
        {formatDate(occupancy.moveInDate)}. Their slot becomes free right away.
      </p>
      <Input label="Move-out date" type="date" {...register('actualMoveOutDate')} error={errors.actualMoveOutDate?.message} />
      <FormError message={errors.root?.message} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Confirm move-out'}
        </Button>
      </div>
    </form>
  )
}

type OccupancyActionsProps = {
  occupancy: Occupancy
  onMoveOut: (occupancy: Occupancy) => void
  onCancelStay: (occupancy: Occupancy) => void
}

// D5: only active occupancies can be moved out or cancelled.
function OccupancyActions({ occupancy, onMoveOut, onCancelStay }: OccupancyActionsProps) {
  if (occupancy.status !== 'active') return null
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button variant="secondary" size="sm" onClick={() => onMoveOut(occupancy)}>
        Move out
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onCancelStay(occupancy)}>
        Cancel
      </Button>
    </div>
  )
}

function stayText(occupancy: Occupancy) {
  if (occupancy.actualMoveOutDate) return `${formatDate(occupancy.moveInDate)} to ${formatDate(occupancy.actualMoveOutDate)}`
  if (occupancy.expectedMoveOutDate) return `${formatDate(occupancy.moveInDate)} to ${formatDate(occupancy.expectedMoveOutDate)} (expected)`
  return `Since ${formatDate(occupancy.moveInDate)}`
}

// A table on medium screens and up, stacked cards on phones (§8).
function OccupancyList({ occupancies, ...actions }: { occupancies: Occupancy[] } & Omit<OccupancyActionsProps, 'occupancy'>) {
  return (
    <>
      <Card padded={false} className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs font-medium tracking-wide text-ink-muted uppercase">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Room</th>
              <th className="hidden px-4 py-3 lg:table-cell">Stay</th>
              <th className="hidden px-4 py-3 lg:table-cell">Rate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {occupancies.map((occupancy) => (
              <tr key={occupancy._id}>
                <td className="px-4 py-3">
                  <Link to={`/tenants/${occupancy.tenant._id}`} className="font-semibold text-ink hover:text-primary">
                    {occupancy.tenant.fullName}
                  </Link>
                  <p className="text-xs text-ink-muted">{occupancy.tenant.phone}</p>
                </td>
                <td className="px-4 py-3">
                  <Link to={`/rooms/${occupancy.room._id}`} className="font-medium text-ink hover:text-primary">
                    Room {occupancy.room.roomNumber}
                  </Link>
                  {occupancy.bedLabel && <p className="text-xs text-ink-muted">{occupancy.bedLabel}</p>}
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">{stayText(occupancy)}</td>
                <td className="hidden px-4 py-3 lg:table-cell">{formatPeso(occupancy.agreedMonthlyRate)}</td>
                <td className="px-4 py-3">
                  <Badge tone={OCCUPANCY_STATUS_TONE[occupancy.status]}>{formatLabel(occupancy.status)}</Badge>
                </td>
                <td className="px-4 py-3">
                  <OccupancyActions occupancy={occupancy} {...actions} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ul className="space-y-3 md:hidden">
        {occupancies.map((occupancy) => (
          <li key={occupancy._id}>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/tenants/${occupancy.tenant._id}`} className="font-semibold text-ink hover:text-primary">
                    {occupancy.tenant.fullName}
                  </Link>
                  <p className="text-xs text-ink-muted">
                    Room {occupancy.room.roomNumber}
                    {occupancy.bedLabel ? ` · ${occupancy.bedLabel}` : ''} · {formatPeso(occupancy.agreedMonthlyRate)} / month
                  </p>
                </div>
                <Badge tone={OCCUPANCY_STATUS_TONE[occupancy.status]}>{formatLabel(occupancy.status)}</Badge>
              </div>
              <p className="mt-2 text-sm text-ink-muted">{stayText(occupancy)}</p>
              <div className="mt-3">
                <OccupancyActions occupancy={occupancy} {...actions} />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}

function OccupanciesPage() {
  const { showToast } = useOutletContext<LayoutContext>()
  const [status, setStatus] = useState('active')

  const loadOccupancies = useCallback(() => getOccupancies({ status }), [status])
  const { data: occupancies, error, refetch } = useApi(loadOccupancies)

  const [assignOpen, setAssignOpen] = useState(false)
  const [movingOut, setMovingOut] = useState<Occupancy | null>(null)
  const [cancelling, setCancelling] = useState<Occupancy | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancelBusy, setCancelBusy] = useState(false)

  function handleAssigned(occupancy: Occupancy) {
    showToast(`${occupancy.tenant.fullName} assigned to Room ${occupancy.room.roomNumber}`)
    setAssignOpen(false)
    refetch()
  }

  function handleMovedOut(occupancy: Occupancy) {
    showToast(`${occupancy.tenant.fullName} moved out of Room ${occupancy.room.roomNumber}`)
    setMovingOut(null)
    refetch()
  }

  function askToCancel(occupancy: Occupancy) {
    setCancelError(null)
    setCancelling(occupancy)
  }

  async function confirmCancel() {
    if (!cancelling) return
    setCancelBusy(true)
    try {
      await cancelOccupancy(cancelling._id)
      showToast(`Assignment of ${cancelling.tenant.fullName} to Room ${cancelling.room.roomNumber} cancelled`)
      setCancelling(null)
      refetch()
    } catch (error) {
      setCancelError(toApiError(error).message)
    } finally {
      setCancelBusy(false)
    }
  }

  let content
  if (error) {
    content = <ErrorState message={error.message} onRetry={refetch} />
  } else if (!occupancies) {
    content = <LoadingState label="Loading occupancies..." />
  } else if (occupancies.length === 0) {
    content = status ? (
      <EmptyState title={`No ${formatLabel(status).toLowerCase()} occupancies`} message="Choose another status to see more." />
    ) : (
      <EmptyState
        title="No occupancies yet"
        message="Assign a tenant to a room to get started."
        action={<Button onClick={() => setAssignOpen(true)}>Assign tenant</Button>}
      />
    )
  } else {
    content = <OccupancyList occupancies={occupancies} onMoveOut={setMovingOut} onCancelStay={askToCancel} />
  }

  return (
    <>
      <PageHeader
        title="Occupancies"
        description="Who is assigned to which room. Move tenants out or cancel assignments here."
        actions={
          <Button onClick={() => setAssignOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Assign tenant
          </Button>
        }
      />

      <Card className="mb-4 grid gap-3 sm:grid-cols-3">
        <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {OCCUPANCY_STATUSES.map((value) => (
            <option key={value} value={value}>
              {formatLabel(value)}
            </option>
          ))}
        </Select>
      </Card>

      {content}

      <Dialog open={assignOpen} title="Assign tenant to a room" onClose={() => setAssignOpen(false)}>
        <AssignPanel onCancel={() => setAssignOpen(false)} onSaved={handleAssigned} />
      </Dialog>

      <Dialog open={movingOut !== null} title="Move out" onClose={() => setMovingOut(null)}>
        {movingOut && <MoveOutForm occupancy={movingOut} onCancel={() => setMovingOut(null)} onSaved={handleMovedOut} />}
      </Dialog>

      <ConfirmDialog
        open={cancelling !== null}
        title="Cancel this assignment?"
        message={
          cancelling
            ? `${cancelling.tenant.fullName}'s assignment to Room ${cancelling.room.roomNumber} will be cancelled and the slot freed. A cancelled assignment cannot be reopened.`
            : ''
        }
        confirmLabel="Cancel assignment"
        cancelLabel="Keep it"
        loading={cancelBusy}
        error={cancelError}
        onConfirm={confirmCancel}
        onCancel={() => setCancelling(null)}
      />
    </>
  )
}

export default OccupanciesPage
