import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useOutletContext } from 'react-router'
import { toApiError } from '../api/axios'
import { createTenant, deleteTenant, getTenants, updateTenant } from '../api/tenants'
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
import useDebounce from '../hooks/useDebounce'
import { tenantSchema, type TenantFormValues } from '../schemas/tenantSchema'
import type { LayoutContext } from '../types/layout'
import { TENANT_STATUS_TONE, TENANT_STATUSES, type Tenant } from '../types/tenant'
import { formatLabel } from '../utils/format'

type TenantFormProps = {
  tenant: Tenant | null // null when adding a new tenant
  onCancel: () => void
  onSaved: (tenant: Tenant) => void
}

function TenantForm({ tenant, onCancel, onSaved }: TenantFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      firstName: tenant?.firstName ?? '',
      lastName: tenant?.lastName ?? '',
      email: tenant?.email ?? '',
      phone: tenant?.phone ?? '',
      address: tenant?.address ?? '',
      emergencyContactName: tenant?.emergencyContactName ?? '',
      emergencyContactPhone: tenant?.emergencyContactPhone ?? '',
      status: tenant?.status ?? 'active',
    },
  })

  async function onSubmit(values: TenantFormValues) {
    try {
      const saved = tenant ? await updateTenant(tenant._id, values) : await createTenant(values)
      onSaved(saved)
    } catch (error) {
      // e.g. "email already exists", or D7: an active tenant cannot be set to inactive
      setError('root', { message: toApiError(error).message })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="First name" {...register('firstName')} error={errors.firstName?.message} />
        <Input label="Last name" {...register('lastName')} error={errors.lastName?.message} />
        <Input label="Phone" placeholder="09171234567" inputMode="numeric" {...register('phone')} error={errors.phone?.message} />
        <Input label="Email (optional)" type="email" {...register('email')} error={errors.email?.message} />
      </div>
      <Input label="Address (optional)" {...register('address')} error={errors.address?.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Emergency contact name"
          {...register('emergencyContactName')}
          error={errors.emergencyContactName?.message}
        />
        <Input
          label="Emergency contact phone"
          placeholder="09181234567"
          inputMode="numeric"
          {...register('emergencyContactPhone')}
          error={errors.emergencyContactPhone?.message}
        />
      </div>
      <Select label="Status" {...register('status')} error={errors.status?.message}>
        {TENANT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {formatLabel(status)}
          </option>
        ))}
      </Select>

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
          {isSubmitting ? 'Saving...' : 'Save tenant'}
        </Button>
      </div>
    </form>
  )
}

type TenantActionsProps = {
  tenant: Tenant
  onEdit: (tenant: Tenant) => void
  onDelete: (tenant: Tenant) => void
}

function TenantActions({ tenant, onEdit, onDelete }: TenantActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        to={`/tenants/${tenant._id}`}
        aria-label={`View ${tenant.fullName}`}
        className="rounded-lg p-2 text-ink-muted hover:bg-surface hover:text-ink"
      >
        <Eye className="size-4" aria-hidden="true" />
      </Link>
      <Button variant="ghost" size="sm" aria-label={`Edit ${tenant.fullName}`} onClick={() => onEdit(tenant)}>
        <Pencil className="size-4" aria-hidden="true" />
      </Button>
      <Button variant="ghost" size="sm" aria-label={`Delete ${tenant.fullName}`} onClick={() => onDelete(tenant)}>
        <Trash2 className="size-4 text-danger" aria-hidden="true" />
      </Button>
    </div>
  )
}

// A table on medium screens and up, stacked cards on phones (§8).
function TenantList({ tenants, onEdit, onDelete }: { tenants: Tenant[] } & Omit<TenantActionsProps, 'tenant'>) {
  return (
    <>
      <Card padded={false} className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs font-medium tracking-wide text-ink-muted uppercase">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="hidden px-4 py-3 lg:table-cell">Emergency contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tenants.map((tenant) => (
              <tr key={tenant._id}>
                <td className="px-4 py-3">
                  <Link to={`/tenants/${tenant._id}`} className="font-semibold text-ink hover:text-primary">
                    {tenant.fullName}
                  </Link>
                  <p className="text-xs text-ink-muted">{tenant.email ?? 'No email'}</p>
                </td>
                <td className="px-4 py-3">{tenant.phone}</td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  {tenant.emergencyContactName}
                  <p className="text-xs text-ink-muted">{tenant.emergencyContactPhone}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={TENANT_STATUS_TONE[tenant.status]}>{formatLabel(tenant.status)}</Badge>
                </td>
                <td className="px-4 py-3">
                  <TenantActions tenant={tenant} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ul className="space-y-3 md:hidden">
        {tenants.map((tenant) => (
          <li key={tenant._id}>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/tenants/${tenant._id}`} className="font-semibold text-ink hover:text-primary">
                    {tenant.fullName}
                  </Link>
                  <p className="truncate text-xs text-ink-muted">{tenant.email ?? 'No email'}</p>
                </div>
                <Badge tone={TENANT_STATUS_TONE[tenant.status]}>{formatLabel(tenant.status)}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-sm text-ink">{tenant.phone}</p>
                <TenantActions tenant={tenant} onEdit={onEdit} onDelete={onDelete} />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}

function TenantsPage() {
  const { showToast } = useOutletContext<LayoutContext>()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const debouncedSearch = useDebounce(search)

  const loadTenants = useCallback(() => getTenants({ search: debouncedSearch, status }), [debouncedSearch, status])
  const { data: tenants, error, refetch } = useApi(loadTenants)

  // The form dialog: null = closed, 'new' = adding, a tenant = editing that tenant.
  const [formTenant, setFormTenant] = useState<Tenant | 'new' | null>(null)
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const hasFilters = search !== '' || status !== ''

  function handleSaved(tenant: Tenant) {
    showToast(formTenant === 'new' ? `${tenant.fullName} added` : `${tenant.fullName} updated`)
    setFormTenant(null)
    refetch()
  }

  function askToDelete(tenant: Tenant) {
    setDeleteError(null)
    setDeletingTenant(tenant)
  }

  async function confirmDelete() {
    if (!deletingTenant) return
    setDeleting(true)
    try {
      await deleteTenant(deletingTenant._id)
      showToast(`${deletingTenant.fullName} deleted`)
      setDeletingTenant(null)
      refetch()
    } catch (error) {
      setDeleteError(toApiError(error).message) // D7: "...Set the tenant to inactive instead"
    } finally {
      setDeleting(false)
    }
  }

  let content
  if (error) {
    content = <ErrorState message={error.message} onRetry={refetch} />
  } else if (!tenants) {
    content = <LoadingState label="Loading tenants..." />
  } else if (tenants.length === 0) {
    content = hasFilters ? (
      <EmptyState title="No tenants match your filters" message="Try another search or clear the filters." />
    ) : (
      <EmptyState
        title="No tenants yet"
        message="Add a tenant before assigning them to a room."
        action={<Button onClick={() => setFormTenant('new')}>Add tenant</Button>}
      />
    )
  } else {
    content = <TenantList tenants={tenants} onEdit={setFormTenant} onDelete={askToDelete} />
  }

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Everyone who stays or has stayed here, with their contact details."
        actions={
          <Button onClick={() => setFormTenant('new')}>
            <Plus className="size-4" aria-hidden="true" />
            Add tenant
          </Button>
        }
      />

      <Card className="mb-4 grid gap-3 sm:grid-cols-3">
        <Input
          label="Search"
          type="search"
          placeholder="Name, email or phone"
          className="sm:col-span-2"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {TENANT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {formatLabel(value)}
            </option>
          ))}
        </Select>
      </Card>

      {content}

      <Dialog
        open={formTenant !== null}
        title={formTenant && formTenant !== 'new' ? `Edit ${formTenant.fullName}` : 'Add tenant'}
        onClose={() => setFormTenant(null)}
      >
        <TenantForm tenant={formTenant === 'new' ? null : formTenant} onCancel={() => setFormTenant(null)} onSaved={handleSaved} />
      </Dialog>

      <ConfirmDialog
        open={deletingTenant !== null}
        title={`Delete ${deletingTenant?.fullName ?? 'tenant'}?`}
        message="This permanently removes the tenant. A tenant with occupancy, billing or payment history cannot be deleted; set them to inactive instead."
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingTenant(null)}
      />
    </>
  )
}

export default TenantsPage
