import { Suspense } from 'react'
import VerifyForm from './VerifyForm'

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; phone?: string; name?: string; type?: string }>
}) {
  const params = await searchParams
  return (
    <Suspense>
      <VerifyForm
        email={params.email}
        phone={params.phone}
        name={params.name}
        type={params.type ?? 'login'}
      />
    </Suspense>
  )
}
