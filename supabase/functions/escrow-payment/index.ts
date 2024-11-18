import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing escrow payment request');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse and validate request body
    const { appointment_id, action, amount } = await req.json()
    
    if (!appointment_id || !action || !amount) {
      console.error('Missing required parameters:', { appointment_id, action, amount });
      throw new Error('Missing required parameters: appointment_id, action, or amount')
    }

    console.log('Processing action:', action, 'for appointment:', appointment_id);

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select(`
        *,
        agent:agents(*),
        customer:customers(*)
      `)
      .eq('id', appointment_id)
      .single()

    if (appointmentError) {
      console.error('Error fetching appointment:', appointmentError);
      throw new Error(`Error fetching appointment: ${appointmentError.message}`)
    }

    // Initialize ethers provider and wallet
    const provider = new ethers.JsonRpcProvider(Deno.env.get('ETHEREUM_RPC_URL'))
    const escrowWallet = new ethers.Wallet(Deno.env.get('ESCROW_PRIVATE_KEY') ?? '', provider)

    console.log('Processing payment action:', action)

    let transaction;
    switch (action) {
      case 'pay': {
        // Create escrow payment record
        const { error } = await supabaseClient
          .from('escrow_payments')
          .insert({
            appointment_id,
            amount,
            status: 'pending'
          })

        if (error) {
          console.error('Error creating escrow payment:', error);
          throw new Error(`Error creating escrow payment: ${error.message}`)
        }

        // Update appointment payment status
        await supabaseClient
          .from('appointments')
          .update({ payment_status: 'pending' })
          .eq('id', appointment_id)

        break
      }

      case 'complete': {
        // Transfer funds to agent
        transaction = await escrowWallet.sendTransaction({
          to: appointment.agent.wallet_id,
          value: ethers.parseEther(amount.toString())
        })

        console.log('Payment completed, transaction hash:', transaction.hash)

        // Update escrow payment record
        const { error } = await supabaseClient
          .from('escrow_payments')
          .update({
            status: 'completed',
            transaction_hash: transaction.hash,
            released_at: new Date().toISOString()
          })
          .eq('appointment_id', appointment_id)

        if (error) {
          console.error('Error updating escrow payment:', error);
          throw new Error(`Error updating escrow payment: ${error.message}`)
        }

        // Update appointment status
        await supabaseClient
          .from('appointments')
          .update({
            payment_status: 'paid',
            status: 'completed'
          })
          .eq('id', appointment_id)

        break
      }

      case 'refund': {
        // Return funds to customer
        transaction = await escrowWallet.sendTransaction({
          to: appointment.customer.wallet_id,
          value: ethers.parseEther(amount.toString())
        })

        console.log('Refund completed, transaction hash:', transaction.hash)

        // Update escrow payment record
        const { error } = await supabaseClient
          .from('escrow_payments')
          .update({
            status: 'refunded',
            transaction_hash: transaction.hash,
            released_at: new Date().toISOString()
          })
          .eq('appointment_id', appointment_id)

        if (error) {
          console.error('Error updating escrow payment:', error);
          throw new Error(`Error updating escrow payment: ${error.message}`)
        }

        // Update appointment status
        await supabaseClient
          .from('appointments')
          .update({
            payment_status: 'refunded',
            status: 'cancelled'
          })
          .eq('id', appointment_id)

        break
      }

      default:
        throw new Error('Invalid action')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        transaction: transaction?.hash
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in escrow-payment function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})