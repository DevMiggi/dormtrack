import { ArrowLeft, BedDouble, Percent, SearchX, Wallet, Wrench } from 'lucide-react'
import { useCallback } from 'react'
import { Link, useParams } from 'react-router'
import { getRoom } from '../api/rooms'
import AvailabilityBar from '../components/ui/AvailabilityBar'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import LoadingState from '../components/ui/LoadingState'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import useApi from '../hooks/useApi'
import { MAINTENANCE_PRIORITY_TONE, MAINTENANCE_STATUS_TONE } from '../types/maintenance'
import { OCCUPANCY_STATUS_TONE } from '../types/occupancy'
import { ROOM_CONDITION_TONE, type RoomDetails } from '../types/room'
import { formatDate, formatLabel, formatPercent, formatPeso } from '../utils/format'

function BackLink() {
  return (
    <Link to="/rooms" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" />
      All rooms
    </Link>
  )
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mb-3 text-base font-semibold text-ink">{children}</h2>
}

function RoomInfo({ room }: { room: RoomDetails }) {
  return (
    <Card>
      <SectionTitle>Room info</SectionTitle>
      <AvailabilityBar occupied={room.activeOccupants} capacity={room.capacity} muted={room.conditionStatus !== 'active'} />
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-ink-muted">Capacity</dt>
          <dd className="font-medium text-ink">{room.capacity}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Available</dt>
          <dd className="font-medium text-ink">{room.isAvailable ? 'Yes' : 'No'}</dd>
        </div>
      </dl>
      <div className="mt-4">
        <p className="text-sm text-ink-muted">Amenities</p>
        {room.amenities.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {room.amenities.map((amenity) => (
              <li key={amenity}>
                <Badge tone="primary">{amenity}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-ink">None listed</p>
        )}
      </div>
      {room.notes && (
        <div className="mt-4">
          <p className="text-sm text-ink-muted">Notes</p>
          <p className="mt-1 text-sm text-ink">{room.notes}</p>
        </div>
      )}
    </Card>
  )
}

function CurrentTenants({ room }: { room: RoomDetails }) {
  return (
    <Card>
      <SectionTitle>Current tenants</SectionTitle>
      {room.currentTenants.length === 0 ? (
        <p className="text-sm text-ink-muted">No one is staying in this room right now.</p>
      ) : (
        <ul className="divide-y divide-line">
          {room.currentTenants.map((occupancy) => (
            <li key={occupancy._id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <Link to={`/tenants/${occupancy.tenant._id}`} className="font-medium text-ink hover:text-primary">
                  {occupancy.tenant.fullName}
                </Link>
                <p className="text-xs text-ink-muted">
                  {occupancy.bedLabel ? `${occupancy.bedLabel} · ` : ''}Moved in {formatDate(occupancy.moveInDate)}
                </p>
              </div>
              <span className="text-sm text-ink-muted">{occupancy.tenant.phone}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function OccupancyHistory({ room }: { room: RoomDetails }) {
  return (
    <Card>
      <SectionTitle>Occupancy history</SectionTitle>
      {room.occupancyHistory.length === 0 ? (
        <p className="text-sm text-ink-muted">No one has stayed in this room yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {room.occupancyHistory.map((occupancy) => (
            <li key={occupancy._id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <Link to={`/tenants/${occupancy.tenant._id}`} className="font-medium text-ink hover:text-primary">
                  {occupancy.tenant.fullName}
                </Link>
                <p className="text-xs text-ink-muted">
                  {formatDate(occupancy.moveInDate)} to{' '}
                  {occupancy.actualMoveOutDate ? formatDate(occupancy.actualMoveOutDate) : 'present'} ·{' '}
                  {formatPeso(occupancy.agreedMonthlyRate)} / month
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

function MaintenanceHistory({ room }: { room: RoomDetails }) {
  return (
    <Card>
      <SectionTitle>Maintenance history</SectionTitle>
      {room.maintenanceHistory.length === 0 ? (
        <p className="text-sm text-ink-muted">No maintenance requests for this room.</p>
      ) : (
        <ul className="divide-y divide-line">
          {room.maintenanceHistory.map((request) => (
            <li key={request._id} className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{request.description}</p>
                <p className="text-xs text-ink-muted">
                  {formatLabel(request.category)} · Reported {formatDate(request.dateReported)}
                  {request.resolvedAt ? ` · Resolved ${formatDate(request.resolvedAt)}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge tone={MAINTENANCE_PRIORITY_TONE[request.priority]}>{formatLabel(request.priority)}</Badge>
                <Badge tone={MAINTENANCE_STATUS_TONE[request.status]}>{formatLabel(request.status)}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function RoomDetailsPage() {
  const { id = '' } = useParams()
  const loadRoom = useCallback(() => getRoom(id), [id])
  const { data: room, error, refetch } = useApi(loadRoom)

  // §8: a clear "not found" state when the API answers 404.
  if (error?.status === 404) {
    return (
      <>
        <BackLink />
        <EmptyState
          icon={SearchX}
          title="Room not found"
          message="There is no room with this ID. It may have been deleted."
          action={
            <Link to="/rooms" className="text-sm font-medium text-primary hover:underline">
              Back to all rooms
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
  if (!room) return <LoadingState label="Loading room..." />

  // Derived during render, never stored in state.
  let slotsTone: 'success' | 'warning' | 'danger' = 'success'
  if (room.availableSlots === 0) slotsTone = 'danger'
  else if (room.occupancyRate >= 75) slotsTone = 'warning'

  return (
    <>
      <BackLink />
      <PageHeader
        title={`Room ${room.roomNumber}`}
        description={`${room.floor} · ${formatLabel(room.roomType)} room`}
        actions={<Badge tone={ROOM_CONDITION_TONE[room.conditionStatus]}>{formatLabel(room.conditionStatus)}</Badge>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Slots left" value={room.availableSlots} hint={`of ${room.capacity}`} icon={BedDouble} tone={slotsTone} />
        <StatCard label="Occupancy rate" value={formatPercent(room.occupancyRate)} icon={Percent} />
        <StatCard label="Monthly rate" value={formatPeso(room.monthlyRate)} icon={Wallet} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RoomInfo room={room} />
        <div className="space-y-4 lg:col-span-2">
          <CurrentTenants room={room} />
          <OccupancyHistory room={room} />
        </div>
      </div>

      <div className="mt-4">
        <MaintenanceHistory room={room} />
      </div>

      {room.conditionStatus === 'maintenance' && (
        <p className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
          <Wrench className="size-4" aria-hidden="true" />
          This room is under maintenance, so it cannot take new tenants.
        </p>
      )}
    </>
  )
}

export default RoomDetailsPage
