import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useOutletContext } from 'react-router'
import { toApiError } from '../api/axios'
import {
  changeMaintenanceStatus,
  createMaintenanceRequest,
  deleteMaintenanceRequest,
  getMaintenanceRequests,
  updateMaintenanceRequest,
} from '../api/maintenanceRequests'
import { getRooms } from '../api/rooms'
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
import {
  maintenanceSchema,
  resolveSchema,
  type MaintenanceFormValues,
  type ResolveFormValues,
} from '../schemas/maintenanceSchema'
import type { LayoutContext } from '../types/layout'
import {
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_PRIORITY_TONE,
  MAINTENANCE_STATUS_TONE,
  MAINTENANCE_STATUSES,
  NEXT_STATUSES,
  STATUS_ACTION_LABEL,
  type MaintenanceRequest,
  type MaintenanceStatus,
} from '../types/maintenance'
import type { Room } from '../types/room'
import type { Tenant } from '../types/tenant'
import { formatDate, formatLabel, toDateInputValue } from '../utils/format'

function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
      {message}
    </p>
  )
}

type RequestFormProps = {
  request: MaintenanceRequest | null // null when reporting a new problem
  rooms: Room[]
  tenants: Tenant[]
  onCancel: () => void
  onSaved: (request: MaintenanceRequest) => void
}

function RequestForm({ request, rooms, tenants, onCancel, onSaved }: RequestFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      room: request?.room._id ?? '',
      tenant: request?.tenant?._id ?? '',
      category: request?.category ?? 'plumbing',
      priority: request?.priority ?? 'medium',
      description: request?.description ?? '',
      dateReported: toDateInputValue(request?.dateReported ?? new Date()),
    },
  })

  async function onSubmit(values: MaintenanceFormValues) {
    try {
      onSaved(request ? await updateMaintenanceRequest(request._id, values) : await createMaintenanceRequest(values))
    } catch (error) {
      setError('root', { message: toApiError(error).message })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Room" {...register('room')} error={errors.room?.message}>
          <option value="">Choose a room</option>
          {rooms.map((room) => (
            <option key={room._id} value={room._id}>
              Room {room.roomNumber} · {room.floor}
            </option>
          ))}
        </Select>
        <Select label="Reported by (optional)" {...register('tenant')} error={errors.tenant?.message}>
          <option value="">No tenant</option>
          {tenants.map((tenant) => (
            <option key={tenant._id} value={tenant._id}>
              {tenant.fullName}
            </option>
          ))}
        </Select>
        <Select label="Category" {...register('category')} error={errors.category?.message}>
          {MAINTENANCE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {formatLabel(category)}
            </option>
          ))}
        </Select>
        <Select label="Priority" {...register('priority')} error={errors.priority?.message}>
          {MAINTENANCE_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {formatLabel(priority)}
            </option>
          ))}
        </Select>
      </div>
      <Textarea label="Description" placeholder="What needs fixing?" {...register('description')} error={errors.description?.message} />
      <Input label="Date reported" type="date" {...register('dateReported')} error={errors.dateReported?.message} />

      <FormError message={errors.root?.message} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : request ? 'Save changes' : 'Report problem'}
        </Button>
      </div>
    </form>
  )
}

// Loads rooms and tenants for the form when the dialog opens.
function RequestFormPanel({ request, onCancel, onSaved }: Omit<RequestFormProps, 'rooms' | 'tenants'>) {
  const loadChoices = useCallback(async () => {
    const [rooms, tenants] = await Promise.all([getRooms(), getTenants()])
    return { rooms, tenants }
  }, [])
  const { data, error, refetch } = useApi(loadChoices)

  if (error) return <ErrorState message={error.message} onRetry={refetch} />
  if (!data) return <LoadingState label="Loading rooms and tenants..." />
  return <RequestForm request={request} rooms={data.rooms} tenants={data.tenants} onCancel={onCancel} onSaved={onSaved} />
}

type ResolveFormProps = {
  request: MaintenanceRequest
  onCancel: () => void
  onSaved: (request: MaintenanceRequest) => void
}

function ResolveForm({ request, onCancel, onSaved }: ResolveFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResolveFormValues>({ resolver: zodResolver(resolveSchema), defaultValues: { resolutionNotes: '' } })

  async function onSubmit(values: ResolveFormValues) {
    try {
      onSaved(await changeMaintenanceStatus(request._id, 'resolved', values.resolutionNotes))
    } catch (error) {
      setError('root', { message: toApiError(error).message })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <p className="text-sm text-ink-muted">
        Room {request.room.roomNumber}: {request.description}
      </p>
      <Textarea label="Resolution notes" placeholder="What was done?" {...register('resolutionNotes')} error={errors.resolutionNotes?.message} />
      <FormError message={errors.root?.message} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Mark as resolved'}
        </Button>
      </div>
    </form>
  )
}

type RequestCardProps = {
  request: MaintenanceRequest
  busy: boolean // a status change for this request is in progress
  onStatusAction: (request: MaintenanceRequest, nextStatus: MaintenanceStatus) => void
  onEdit: (request: MaintenanceRequest) => void
  onDelete: (request: MaintenanceRequest) => void
}

function RequestCard({ request, busy, onStatusAction, onEdit, onDelete }: RequestCardProps) {
  // D13: only the moves allowed from the current status get a button.
  const nextStatuses = NEXT_STATUSES[request.status]

  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 flex-1 font-medium text-ink">{request.description}</p>
        <div className="flex gap-2">
          <Badge tone={MAINTENANCE_PRIORITY_TONE[request.priority]}>{formatLabel(request.priority)}</Badge>
          <Badge tone={MAINTENANCE_STATUS_TONE[request.status]}>{formatLabel(request.status)}</Badge>
        </div>
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        <Link to={`/rooms/${request.room._id}`} className="font-medium text-primary hover:underline">
          Room {request.room.roomNumber}
        </Link>
        {' · '}
        {request.tenant ? (
          <Link to={`/tenants/${request.tenant._id}`} className="hover:underline">
            {request.tenant.fullName}
          </Link>
        ) : (
          'No tenant'
        )}
        {' · '}
        {formatLabel(request.category)} · Reported {formatDate(request.dateReported)}
      </p>

      {request.status === 'resolved' && request.resolvedAt && (
        <p className="mt-3 rounded-lg bg-success-light px-3 py-2 text-sm text-success">
          Resolved {formatDate(request.resolvedAt)}: {request.resolutionNotes}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
        <div className="flex flex-wrap gap-2">
          {nextStatuses.map((status) => (
            <Button
              key={status}
              size="sm"
              variant={status === 'cancelled' ? 'ghost' : 'primary'}
              disabled={busy}
              onClick={() => onStatusAction(request, status)}
            >
              {STATUS_ACTION_LABEL[status]}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" aria-label={`Edit request: ${request.description}`} onClick={() => onEdit(request)}>
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="sm" aria-label={`Delete request: ${request.description}`} onClick={() => onDelete(request)}>
            <Trash2 className="size-4 text-danger" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

function MaintenancePage() {
  const { showToast } = useOutletContext<LayoutContext>()
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')

  const loadRequests = useCallback(() => getMaintenanceRequests({ status, priority }), [status, priority])
  const { data: requests, error, refetch } = useApi(loadRequests)

  // The form dialog: null = closed, 'new' = reporting, a request = editing that request.
  const [formRequest, setFormRequest] = useState<MaintenanceRequest | 'new' | null>(null)
  const [resolving, setResolving] = useState<MaintenanceRequest | null>(null)
  const [cancelling, setCancelling] = useState<MaintenanceRequest | null>(null)
  const [deletingRequest, setDeletingRequest] = useState<MaintenanceRequest | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [dialogBusy, setDialogBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const hasFilters = status !== '' || priority !== ''

  function handleSaved(request: MaintenanceRequest) {
    showToast(formRequest === 'new' ? `Problem reported for Room ${request.room.roomNumber}` : 'Request updated')
    setFormRequest(null)
    refetch()
  }

  function handleResolved(request: MaintenanceRequest) {
    showToast(`Request for Room ${request.room.roomNumber} resolved`)
    setResolving(null)
    refetch()
  }

  // Resolving needs notes and cancelling is final, so both open a dialog first. Starting work happens at once.
  async function handleStatusAction(request: MaintenanceRequest, nextStatus: MaintenanceStatus) {
    if (nextStatus === 'resolved') {
      setResolving(request)
      return
    }
    if (nextStatus === 'cancelled') {
      setDialogError(null)
      setCancelling(request)
      return
    }
    setBusyId(request._id)
    try {
      await changeMaintenanceStatus(request._id, nextStatus)
      showToast(`Work started on Room ${request.room.roomNumber}`)
      refetch()
    } catch (error) {
      showToast(toApiError(error).message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  // Runs the confirmed action of a ConfirmDialog and shows the server's message if it fails.
  async function runConfirmed(action: () => Promise<void>, message: string, close: () => void) {
    setDialogBusy(true)
    try {
      await action()
      showToast(message)
      close()
      refetch()
    } catch (error) {
      setDialogError(toApiError(error).message)
    } finally {
      setDialogBusy(false)
    }
  }

  let content
  if (error) {
    content = <ErrorState message={error.message} onRetry={refetch} />
  } else if (!requests) {
    content = <LoadingState label="Loading maintenance requests..." />
  } else if (requests.length === 0) {
    content = hasFilters ? (
      <EmptyState title="No requests match your filters" message="Try another status or priority." />
    ) : (
      <EmptyState
        title="No maintenance requests"
        message="Report a problem when something in a room needs fixing."
        action={<Button onClick={() => setFormRequest('new')}>Report problem</Button>}
      />
    )
  } else {
    content = (
      <>
        <p className="mb-3 text-sm text-ink-muted">
          {requests.length} {requests.length === 1 ? 'request' : 'requests'}
        </p>
        <ul className="grid gap-4 lg:grid-cols-2">
          {requests.map((request) => (
            <li key={request._id}>
              <RequestCard
                request={request}
                busy={busyId === request._id}
                onStatusAction={handleStatusAction}
                onEdit={setFormRequest}
                onDelete={(item) => {
                  setDialogError(null)
                  setDeletingRequest(item)
                }}
              />
            </li>
          ))}
        </ul>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Problems reported in rooms and how far along each one is."
        actions={
          <Button onClick={() => setFormRequest('new')}>
            <Plus className="size-4" aria-hidden="true" />
            Report problem
          </Button>
        }
      />

      <Card className="mb-4 grid gap-3 sm:grid-cols-3">
        <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {MAINTENANCE_STATUSES.map((value) => (
            <option key={value} value={value}>
              {formatLabel(value)}
            </option>
          ))}
        </Select>
        <Select label="Priority" value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="">All priorities</option>
          {MAINTENANCE_PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {formatLabel(value)}
            </option>
          ))}
        </Select>
      </Card>

      {content}

      <Dialog
        open={formRequest !== null}
        title={formRequest === 'new' ? 'Report a problem' : 'Edit request'}
        onClose={() => setFormRequest(null)}
      >
        <RequestFormPanel
          request={formRequest === 'new' ? null : formRequest}
          onCancel={() => setFormRequest(null)}
          onSaved={handleSaved}
        />
      </Dialog>

      <Dialog open={resolving !== null} title="Resolve request" onClose={() => setResolving(null)}>
        {resolving && <ResolveForm request={resolving} onCancel={() => setResolving(null)} onSaved={handleResolved} />}
      </Dialog>

      <ConfirmDialog
        open={cancelling !== null}
        title="Cancel this request?"
        message="A cancelled request is final and cannot be reopened."
        confirmLabel="Cancel request"
        cancelLabel="Keep it"
        loading={dialogBusy}
        error={dialogError}
        onConfirm={() =>
          cancelling &&
          runConfirmed(
            () => changeMaintenanceStatus(cancelling._id, 'cancelled').then(() => undefined),
            `Request for Room ${cancelling.room.roomNumber} cancelled`,
            () => setCancelling(null)
          )
        }
        onCancel={() => setCancelling(null)}
      />

      <ConfirmDialog
        open={deletingRequest !== null}
        title="Delete this request?"
        message="This permanently removes the request from the maintenance history."
        loading={dialogBusy}
        error={dialogError}
        onConfirm={() =>
          deletingRequest &&
          runConfirmed(
            () => deleteMaintenanceRequest(deletingRequest._id),
            'Request deleted',
            () => setDeletingRequest(null)
          )
        }
        onCancel={() => setDeletingRequest(null)}
      />
    </>
  )
}

export default MaintenancePage
