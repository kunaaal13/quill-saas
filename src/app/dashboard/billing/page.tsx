import BillingForm from '@/components/BillingForm'
import { getUserSubscriptionPlan } from '@/lib/stripe'

type PageProps = {}

async function Page({}: PageProps) {
  const subscriptionPlan = await getUserSubscriptionPlan()
  return <BillingForm subscriptionPlan={subscriptionPlan} />
}

export default Page
