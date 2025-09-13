#!/bin/bash

# 🚀 Sui Flash Loan dApp Deployment Script
# NO_GAS-LABS - "Back in my day... gas fees cost your soul™"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
NETWORK=${1:-testnet}
PACKAGE_NAME="SuiFlashLoanDApp"
FRONTEND_DIR="frontend"
CONTRACTS_DIR="contracts"

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    NO_GAS-LABS DEPLOYMENT                   ║"
echo "║                  Sui Flash Loan dApp v1.0                   ║"
echo "║        \"Back in my day... gas fees cost your soul™\"         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to print colored output
print_status() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check if Sui CLI is installed
    if ! command -v sui &> /dev/null; then
        print_error "Sui CLI is not installed. Please install it first."
        echo "Visit: https://docs.sui.io/build/install"
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "All prerequisites met!"
}

# Setup Sui environment
setup_sui_env() {
    print_step "Setting up Sui environment for $NETWORK..."
    
    if [ "$NETWORK" == "testnet" ]; then
        RPC_URL="https://fullnode.testnet.sui.io:443"
        FAUCET_URL="https://faucet.testnet.sui.io/gas"
    elif [ "$NETWORK" == "mainnet" ]; then
        RPC_URL="https://fullnode.mainnet.sui.io:443"
        FAUCET_URL=""
    else
        print_error "Invalid network. Use 'testnet' or 'mainnet'"
        exit 1
    fi
    
    # Add environment if it doesn't exist
    if ! sui client envs | grep -q "$NETWORK"; then
        print_status "Adding $NETWORK environment..."
        sui client new-env --alias $NETWORK --rpc $RPC_URL
    fi
    
    # Switch to the network
    sui client switch --env $NETWORK
    print_success "Switched to $NETWORK environment"
    
    # Check if we have an active address
    if ! sui client active-address &> /dev/null; then
        print_warning "No active address found. Creating new address..."
        sui client new-address ed25519
    fi
    
    ACTIVE_ADDRESS=$(sui client active-address)
    print_status "Active address: $ACTIVE_ADDRESS"
    
    # Check balance for testnet
    if [ "$NETWORK" == "testnet" ]; then
        BALANCE=$(sui client gas --json | jq -r '.[0].balance // 0')
        print_status "Current balance: $BALANCE MIST"
        
        if [ "$BALANCE" -lt 1000000000 ]; then # Less than 1 SUI
            print_warning "Low balance detected. Requesting testnet SUI..."
            curl -X POST -H 'Content-type: application/json' \
                -d "{\"FixedAmountRequest\":{\"recipient\":\"$ACTIVE_ADDRESS\"}}" \
                $FAUCET_URL
            sleep 5
            print_success "Testnet SUI requested. Please wait for confirmation."
        fi
    fi
}

# Build and test Move contracts
build_contracts() {
    print_step "Building and testing Move contracts..."
    
    cd $CONTRACTS_DIR
    
    # Run tests
    print_status "Running Move tests..."
    sui move test
    
    # Build contracts
    print_status "Building Move contracts..."
    sui move build
    
    print_success "Move contracts built successfully!"
    cd ..
}

# Publish Move contracts
publish_contracts() {
    print_step "Publishing Move contracts to $NETWORK..."
    
    cd $CONTRACTS_DIR
    
    # Set gas budget based on network
    if [ "$NETWORK" == "testnet" ]; then
        GAS_BUDGET=30000000  # 0.03 SUI
    else
        GAS_BUDGET=50000000  # 0.05 SUI
    fi
    
    print_status "Publishing with gas budget: $GAS_BUDGET MIST"
    
    # Publish and capture output
    PUBLISH_OUTPUT=$(sui client publish --gas-budget $GAS_BUDGET --json)
    
    if [ $? -eq 0 ]; then
        # Extract package ID
        PACKAGE_ID=$(echo $PUBLISH_OUTPUT | jq -r '.objectChanges[] | select(.type == "published") | .packageId')
        
        if [ "$PACKAGE_ID" != "null" ] && [ -n "$PACKAGE_ID" ]; then
            print_success "Contracts published successfully!"
            print_success "Package ID: $PACKAGE_ID"
            
            # Save package ID to file
            echo $PACKAGE_ID > ../package_id_$NETWORK.txt
            echo "REACT_APP_PACKAGE_ID=$PACKAGE_ID" > ../$FRONTEND_DIR/.env.local
            echo "REACT_APP_NETWORK=$NETWORK" >> ../$FRONTEND_DIR/.env.local
        else
            print_error "Failed to extract package ID from publish output"
            exit 1
        fi
    else
        print_error "Failed to publish contracts"
        exit 1
    fi
    
    cd ..
}

# Build frontend
build_frontend() {
    print_step "Building frontend application..."
    
    cd $FRONTEND_DIR
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm ci
    
    # Run tests
    print_status "Running frontend tests..."
    npm test -- --coverage --watchAll=false || print_warning "Some tests failed, continuing..."
    
    # Build application
    print_status "Building React application..."
    npm run build
    
    print_success "Frontend built successfully!"
    cd ..
}

# Deploy frontend (if Vercel is configured)
deploy_frontend() {
    print_step "Deploying frontend..."
    
    cd $FRONTEND_DIR
    
    if command -v vercel &> /dev/null; then
        print_status "Deploying to Vercel..."
        
        if [ "$NETWORK" == "testnet" ]; then
            vercel --prod --confirm
        else
            print_warning "Mainnet deployment requires manual confirmation"
            vercel --prod
        fi
        
        print_success "Frontend deployed!"
    else
        print_warning "Vercel CLI not installed. Skipping frontend deployment."
        print_status "To deploy manually:"
        print_status "1. Install Vercel CLI: npm i -g vercel"
        print_status "2. Run: vercel --prod"
        print_status "3. Or deploy build/ folder to your hosting service"
    fi
    
    cd ..
}

# Create deployment summary
create_summary() {
    print_step "Creating deployment summary..."
    
    PACKAGE_ID=$(cat package_id_$NETWORK.txt 2>/dev/null || echo "Not available")
    
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    DEPLOYMENT SUMMARY                       ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║ Network: $NETWORK"
    echo "║ Package ID: $PACKAGE_ID"
    echo "║ Timestamp: $(date)"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Create deployment info file
    cat > deployment_info_$NETWORK.json << EOF
{
  "network": "$NETWORK",
  "packageId": "$PACKAGE_ID",
  "deploymentTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployer": "$(sui client active-address)",
  "contracts": {
    "flashLoan": "$PACKAGE_ID::flash_loan",
    "arbitrageDetector": "$PACKAGE_ID::arbitrage_detector",
    "deepbookIntegration": "$PACKAGE_ID::deepbook_integration"
  },
  "frontend": {
    "buildPath": "frontend/build",
    "configFile": "frontend/.env.local"
  }
}
EOF
    
    print_success "Deployment info saved to: deployment_info_$NETWORK.json"
}

# Verify deployment
verify_deployment() {
    print_step "Verifying deployment..."
    
    PACKAGE_ID=$(cat package_id_$NETWORK.txt 2>/dev/null)
    
    if [ -n "$PACKAGE_ID" ]; then
        print_status "Checking package on-chain..."
        sui client object $PACKAGE_ID > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "Package verified on-chain!"
        else
            print_warning "Package verification failed"
        fi
    fi
    
    # Check frontend build
    if [ -d "$FRONTEND_DIR/build" ]; then
        print_success "Frontend build directory exists"
        
        BUILD_SIZE=$(du -sh $FRONTEND_DIR/build | cut -f1)
        print_status "Build size: $BUILD_SIZE"
    else
        print_warning "Frontend build directory not found"
    fi
}

# Cleanup function
cleanup() {
    print_step "Cleaning up temporary files..."
    
    # Remove any temporary files if needed
    find . -name "*.tmp" -delete 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    echo -e "${CYAN}Starting deployment for network: $NETWORK${NC}"
    
    check_prerequisites
    setup_sui_env
    build_contracts
    publish_contracts
    build_frontend
    
    # Only deploy frontend if not in CI/CD (optional)
    if [ -z "$CI" ]; then
        deploy_frontend
    fi
    
    create_summary
    verify_deployment
    cleanup
    
    echo -e "${GREEN}"
    echo "🎉 Deployment completed successfully!"
    echo -e "${NC}"
    echo "Next steps:"
    echo "1. Test the dApp functionality"
    echo "2. Monitor transaction performance"
    echo "3. Update documentation with new package ID"
    
    if [ "$NETWORK" == "testnet" ]; then
        echo "4. Consider mainnet deployment when ready"
    fi
}

# Handle interruption
trap cleanup EXIT
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"