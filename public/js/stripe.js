import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51KwdJYHTkwmWJUsI0Xdd5yv6tlmthR4oLAcE3YHmalaRQPxj5GcEsQYJrkCNdImJZwUFMelMY62jgsbZuvsAyhws00JjClygpm')

export const bookTour = async tourId => {
    try{
        // 1) Get the checkout session from the server / API
        const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`)
        // 2) Create checkout form + credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })
    }catch(err){
        console.error(err);
        showAlert('error', err);
    }

}