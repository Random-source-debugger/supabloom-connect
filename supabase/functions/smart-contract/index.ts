import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS"; // Replace after deployment
const CONTRACT_ABI = [
  "function depositPayment(address payable _agent) public payable returns (uint256)",
  "function refundPayment(uint256 bookingId) public",
  "function releasePayment(uint256 bookingId) public",
  "function getEscrowBalance() public view returns (uint256)"
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { appointment_id, action } = await req.json()

    // Get appointment details with agent and customer info
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
      throw new Error(`Error fetching appointment: ${appointmentError.message}`)
    }

    // Initialize ethers provider and contract
    const provider = new ethers.JsonRpcProvider(Deno.env.get('ETHEREUM_RPC_URL'))
    const wallet = new ethers.Wallet(Deno.env.get('ESCROW_PRIVATE_KEY') ?? '', provider)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet)

    console.log('Processing smart contract action:', action)

    switch (action) {
      case 'deposit': {
        const tx = await contract.depositPayment(appointment.agent.wallet_id, {
          value: ethers.parseEther(appointment.agent.charges.toString())
        })
        await tx.wait()

        // Update appointment payment status
        await supabaseClient
          .from('appointments')
          .update({ payment_status: 'pending' })
          .eq('id', appointment_id)

        break
      }

      case 'refund': {
        const tx = await contract.refundPayment(appointment_id)
        await tx.wait()

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

      case 'release': {
        const tx = await contract.releasePayment(appointment_id)
        await tx.wait()

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

      default:
        throw new Error('Invalid action')
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in smart-contract function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})