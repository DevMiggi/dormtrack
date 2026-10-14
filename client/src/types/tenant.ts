// A tenant inside another record (populated by the API). fullName is a virtual from the server.
export type TenantRef = {
  _id: string
  firstName: string
  lastName: string
  fullName: string
  phone?: string
}
