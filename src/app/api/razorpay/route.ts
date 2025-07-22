
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { randomBytes } from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

export async function POST(request: Request) {
    try {
        const { amount } = await request.json();

        if (!amount || typeof amount !== 'number') {
            return NextResponse.json({ error: 'Invalid amount provided.' }, { status: 400 });
        }
        
        const options = {
            amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_order_${randomBytes(4).toString('hex')}`
        };

        const order = await razorpay.orders.create(options);

        if (!order) {
            return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
        }

        return NextResponse.json({ order }, { status: 200 });

    } catch (error) {
        console.error("Razorpay API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
