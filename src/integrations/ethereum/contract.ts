export const CONTRACT_ADDRESS = "0x123..."; // Replace with your deployed contract address

export const CONTRACT_ABI = [
  // Deposit payment from customer to escrow
  "function depositPayment(address payable _agent) public payable returns (uint256)",
  // Refund payment to customer if booking is canceled
  "function refundPayment(uint256 bookingId) public",
  // Release payment to agent if booking is completed successfully
  "function releasePayment(uint256 bookingId) public",
  // Get balance of contract (escrow account)
  "function getEscrowBalance() public view returns (uint256)"
];