import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useOutletContext } from 'react-router'
import { toApiError } from '../api/axios'
import { createRoom, deleteRoom, getRooms, updateRoom } from '../api/rooms'
import AvailabilityBar from '../components/ui/AvailabilityBar'
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
import useDebounce from '../hooks/useDebounce'
import { roomSchema, type RoomFormValues } from '../schemas/roomSchema'
import type { LayoutContext } from '../types/layout'
import { CAPACITY_BY_TYPE, ROOM_CONDITION_TONE, ROOM_CONDITIONS, ROOM_TYPES, type Room, type RoomType } from '../types/room'
import { formatLabel, formatPeso } from '../utils/format'

type RoomFormProps = {
  room: Room | null // null when adding a new room
  onCancel: () => void
  onSaved: (room: Room) => void
}

function RoomForm({ room, onCancel, onSaved }: RoomFormProps) {
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: room
      ? {
          roomNumber: room.roomNumber,
          floor: room.floor,
          roomType: room.roomType,
          capacity: room.capacity,
          monthlyRate: room.monthlyRate,
          amenities: room.amenities.join(', '),
          conditionStatus: room.conditionStatus,
          notes: room.notes ?? '',
        }
      : { roomNumber: '', floor: '', roomType: 'single', capacity: 1, amenities: '', conditionStatus: 'active', notes: '' },
  })

  // Single and double rooms have a fixed capacity (D6), so fill it in when the type changes.
  function handleTypeChange(type: RoomType) {
    const { min, max } = CAPACITY_BY_TYPE[type]
    const capacity = getValues('capacity')
    if (!(capacity >= min && capacity <= max)) setValue('capacity', min, { shouldValidate: true })
  }

  async function onSubmit(values: RoomFormValues) {
    try {
      const saved = room ? await updateRoom(room._id, values) : await createRoom(values)
      onSaved(saved)
    } catch (error) {
      setError('root', { message: toApiError(error).message }) // e.g. "roomNumber already exists"
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Room number" placeholder="e.g. 101" {...register('roomNumber')} error={errors.roomNumber?.message} />
        <Input label="Floor" placeholder="e.g. 1st Floor" {...register('floor')} error={errors.floor?.message} />
        <Select
          label="Room type"
          {...register('roomType', { onChange: (event) => handleTypeChange(event.target.value as RoomType) })}
          error={errors.roomType?.message}
        >
          {ROOM_TYPES.map((type) => (
            <option key={type} value={type}>
              {formatLabel(type)}
            </option>
          ))}
        </Select>
        <Input
          label="Capacity"
          type="number"
          min={1}
          max={20}
          {...register('capacity', { valueAsNumber: true })}
          error={errors.capacity?.message}
        />
        <Input
          label="Monthly rate (₱)"
          type="number"
          min={0}
          step="0.01"
          {...register('monthlyRate', { valueAsNumber: true })}
          error={errors.monthlyRate?.message}
        />
        <Select label="Status" {...register('conditionStatus')} error={errors.conditionStatus?.message}>
          {ROOM_CONDITIONS.map((status) => (
            <option key={status} value={status}>
              {formatLabel(status)}
            </option>
          ))}
        </Select>
      </div>
      <Input label="Amenities" placeholder="Aircon, Wifi, Study desk" {...register('amenities')} error={errors.amenities?.message} />
      <Textarea label="Notes" {...register('notes')} error={errors.notes?.message} />

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
          {isSubmitting ? 'Saving...' : 'Save room'}
        </Button>
      </div>
    </form>
  )
}

type RoomActionsProps = {
  room: Room
  onEdit: (room: Room) => void
  onDelete: (room: Room) => void
}

function RoomActions({ room, onEdit, onDelete }: RoomActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        to={`/rooms/${room._id}`}
        aria-label={`View room ${room.roomNumber}`}
        className="rounded-lg p-2 text-ink-muted hover:bg-surface hover:text-ink"
      >
        <Eye className="size-4" aria-hidden="true" />
      </Link>
      <Button variant="ghost" size="sm" aria-label={`Edit room ${room.roomNumber}`} onClick={() => onEdit(room)}>
        <Pencil className="size-4" aria-hidden="true" />
      </Button>
      <Button variant="ghost" size="sm" aria-label={`Delete room ${room.roomNumber}`} onClick={() => onDelete(room)}>
        <Trash2 className="size-4 text-danger" aria-hidden="true" />
      </Button>
    </div>
  )
}

// A table on medium screens and up, stacked cards on phones (§8).
function RoomList({ rooms, onEdit, onDelete }: { rooms: Room[] } & Omit<RoomActionsProps, 'room'>) {
  return (
    <>
      <Card padded={false} className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs font-medium tracking-wide text-ink-muted uppercase">
            <tr>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Availability</th>
              <th className="hidden px-4 py-3 lg:table-cell">Monthly rate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rooms.map((room) => (
              <tr key={room._id}>
                <td className="px-4 py-3">
                  <Link to={`/rooms/${room._id}`} className="font-semibold text-ink hover:text-primary">
                    Room {room.roomNumber}
                  </Link>
                  <p className="text-xs text-ink-muted">
                    {room.floor} · {formatLabel(room.roomType)}
                  </p>
                </td>
                <td className="w-56 px-4 py-3">
                  <AvailabilityBar occupied={room.activeOccupants} capacity={room.capacity} muted={room.conditionStatus !== 'active'} />
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">{formatPeso(room.monthlyRate)}</td>
                <td className="px-4 py-3">
                  <Badge tone={ROOM_CONDITION_TONE[room.conditionStatus]}>{formatLabel(room.conditionStatus)}</Badge>
                </td>
                <td className="px-4 py-3">
                  <RoomActions room={room} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ul className="space-y-3 md:hidden">
        {rooms.map((room) => (
          <li key={room._id}>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/rooms/${room._id}`} className="font-semibold text-ink hover:text-primary">
                    Room {room.roomNumber}
                  </Link>
                  <p className="text-xs text-ink-muted">
                    {room.floor} · {formatLabel(room.roomType)}
                  </p>
                </div>
                <Badge tone={ROOM_CONDITION_TONE[room.conditionStatus]}>{formatLabel(room.conditionStatus)}</Badge>
              </div>
              <div className="mt-3">
                <AvailabilityBar occupied={room.activeOccupants} capacity={room.capacity} muted={room.conditionStatus !== 'active'} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-ink">
                  {formatPeso(room.monthlyRate)} <span className="font-normal text-ink-muted">/ month</span>
                </p>
                <RoomActions room={room} onEdit={onEdit} onDelete={onDelete} />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}

function RoomsPage() {
  const { showToast } = useOutletContext<LayoutContext>()
  const [search, setSearch] = useState('')
  const [roomType, setRoomType] = useState('')
  const [conditionStatus, setConditionStatus] = useState('')
  const debouncedSearch = useDebounce(search)

  const loadRooms = useCallback(
    () => getRooms({ search: debouncedSearch, roomType, conditionStatus }),
    [debouncedSearch, roomType, conditionStatus]
  )
  const { data: rooms, error, refetch } = useApi(loadRooms)

  // The form dialog: null = closed, 'new' = adding, a room = editing that room.
  const [formRoom, setFormRoom] = useState<Room | 'new' | null>(null)
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const hasFilters = search !== '' || roomType !== '' || conditionStatus !== ''

  function handleSaved(room: Room) {
    showToast(formRoom === 'new' ? `Room ${room.roomNumber} added` : `Room ${room.roomNumber} updated`)
    setFormRoom(null)
    refetch()
  }

  function askToDelete(room: Room) {
    setDeleteError(null)
    setDeletingRoom(room)
  }

  async function confirmDelete() {
    if (!deletingRoom) return
    setDeleting(true)
    try {
      await deleteRoom(deletingRoom._id)
      showToast(`Room ${deletingRoom.roomNumber} deleted`)
      setDeletingRoom(null)
      refetch()
    } catch (error) {
      setDeleteError(toApiError(error).message) // e.g. "...Set the room to inactive instead"
    } finally {
      setDeleting(false)
    }
  }

  let content
  if (error) {
    content = <ErrorState message={error.message} onRetry={refetch} />
  } else if (!rooms) {
    content = <LoadingState label="Loading rooms..." />
  } else if (rooms.length === 0) {
    content = hasFilters ? (
      <EmptyState title="No rooms match your filters" message="Try another search or clear the filters." />
    ) : (
      <EmptyState
        title="No rooms yet"
        message="Add your first room to start tracking availability."
        action={<Button onClick={() => setFormRoom('new')}>Add room</Button>}
      />
    )
  } else {
    content = <RoomList rooms={rooms} onEdit={setFormRoom} onDelete={askToDelete} />
  }

  return (
    <>
      <PageHeader
        title="Rooms"
        description="Every room with its type, rate and free slots."
        actions={
          <Button onClick={() => setFormRoom('new')}>
            <Plus className="size-4" aria-hidden="true" />
            Add room
          </Button>
        }
      />

      <Card className="mb-4 grid gap-3 sm:grid-cols-3">
        <Input label="Search" type="search" placeholder="Room number or floor" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select label="Type" value={roomType} onChange={(event) => setRoomType(event.target.value)}>
          <option value="">All types</option>
          {ROOM_TYPES.map((type) => (
            <option key={type} value={type}>
              {formatLabel(type)}
            </option>
          ))}
        </Select>
        <Select label="Status" value={conditionStatus} onChange={(event) => setConditionStatus(event.target.value)}>
          <option value="">All statuses</option>
          {ROOM_CONDITIONS.map((status) => (
            <option key={status} value={status}>
              {formatLabel(status)}
            </option>
          ))}
        </Select>
      </Card>

      {content}

      <Dialog
        open={formRoom !== null}
        title={formRoom && formRoom !== 'new' ? `Edit room ${formRoom.roomNumber}` : 'Add room'}
        onClose={() => setFormRoom(null)}
      >
        <RoomForm room={formRoom === 'new' ? null : formRoom} onCancel={() => setFormRoom(null)} onSaved={handleSaved} />
      </Dialog>

      <ConfirmDialog
        open={deletingRoom !== null}
        title={`Delete room ${deletingRoom?.roomNumber ?? ''}?`}
        message="This permanently removes the room. A room with occupancy or maintenance history cannot be deleted; set it to inactive instead."
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingRoom(null)}
      />
    </>
  )
}

export default RoomsPage
