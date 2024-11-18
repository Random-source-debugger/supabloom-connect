import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Contract configuration
const CONTRACT_ADDRESS = "0x123..."; // Replace with your deployed contract address
const CONTRACT_ABI = [
  "function depositPayment(address payable _agent) public payable returns (uint256)",
  "function refundPayment(uint256 bookingId) public",
  "function releasePayment(uint256 bookingId) public",
  "function getEscrowBalance() public view returns (uint256)"
];

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Received request:', req.method);
    
    // Read and parse the request body
    const requestData = await req.json().catch(error => {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid request body');
    });
    
    console.log('Request data:', requestData);
    
    const { appointment_id, action } = requestData;
    
    if (!appointment_id || !action) {
      console.error('Missing required parameters:', { appointment_id, action });
      throw new Error('Missing required parameters: appointment_id or action');
    }

    console.log('Processing smart contract action:', action, 'for appointment:', appointment_id);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select(`
        *,
        agent:agents(*),
        customer:customers(*)
      `)
      .eq('id', appointment_id)
      .single();

    if (appointmentError) {
      console.error('Error fetching appointment:', appointmentError);
      throw new Error(`Error fetching appointment: ${appointmentError.message}`);
    }

    if (!appointment) {
      console.error('Appointment not found:', appointment_id);
      throw new Error('Appointment not found');
    }

    // Initialize ethers provider and wallet
    const provider = new ethers.JsonRpcProvider(Deno.env.get('ETHEREUM_RPC_URL'));
    const wallet = new ethers.Wallet(Deno.env.get('ESCROW_PRIVATE_KEY') ?? '', provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    console.log('Ethereum connection initialized');

    let transaction;
    switch (action) {
      case 'deposit': {
        if (!appointment.agent?.wallet_id) {
          console.error('Agent wallet address not found:', appointment.agent);
          throw new Error('Agent wallet address not found');
        }

        console.log('Initiating deposit to agent wallet:', appointment.agent.wallet_id);
        transaction = await contract.depositPayment(
          appointment.agent.wallet_id,
          { value: ethers.parseEther(appointment.agent.charges.toString()) }
        );
        console.log('Deposit transaction initiated:', transaction.hash);
        break;
      }

      case 'refund': {
        console.log('Initiating refund for appointment:', appointment_id);
        transaction = await contract.refundPayment(appointment_id);
        console.log('Refund transaction initiated:', transaction.hash);
        break;
      }

      case 'release': {
        console.log('Initiating payment release for appointment:', appointment_id);
        transaction = await contract.releasePayment(appointment_id);
        console.log('Release transaction initiated:', transaction.hash);
        break;
      }

      default:
        console.error('Invalid action:', action);
        throw new Error('Invalid action');
    }

    // Wait for transaction confirmation
    const receipt = await transaction.wait();
    console.log('Transaction confirmed:', receipt.hash);

    // Update appointment status in database
    const { error: updateError } = await supabaseClient
      .from('appointments')
      .update({
        payment_status: action === 'deposit' ? 'pending' : 
                       action === 'refund' ? 'refunded' : 
                       action === 'release' ? 'paid' : 'unknown'
      })
      .eq('id', appointment_id);

    if (updateError) {
      console.error('Error updating appointment status:', updateError);
      throw new Error(`Error updating appointment status: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        transaction: receipt.hash
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in smart-contract function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});