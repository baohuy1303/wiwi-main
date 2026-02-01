import DefaultLayout from '@/layouts/default';
import StripePayment from '@/components/StripePayment';

export default function BuyTicketsPage() {
    return (
        <DefaultLayout>
            <div className="container mx-auto px-4 py-8">
                <StripePayment />
            </div>
        </DefaultLayout>
    );
}