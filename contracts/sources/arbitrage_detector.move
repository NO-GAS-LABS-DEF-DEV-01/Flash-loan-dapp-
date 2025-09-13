module sui_flash_loan::arbitrage_detector {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::vector;
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::string::{Self, String};

    // Error codes
    const EInvalidPool: u64 = 0;
    const EProfitTooLow: u64 = 1;
    const EInvalidPrice: u64 = 2;
    const EUnauthorized: u64 = 3;

    // Events
    struct OpportunityDetected has copy, drop {
        detector: address,
        pool_a: address,
        pool_b: address,
        token_pair: String,
        price_difference: u64,
        potential_profit: u64,
        recommended_amount: u64,
        opportunity_type: String,
        timestamp: u64,
    }

    struct OpportunityExecuted has copy, drop {
        executor: address,
        opportunity_id: address,
        actual_profit: u64,
        gas_used: u64,
        timestamp: u64,
    }

    // Data structures
    struct PriceOracle has key {
        id: UID,
        prices: Table<String, u64>, // token_name -> price in micro units
        last_updated: Table<String, u64>, // token_name -> timestamp
        admin: address,
    }

    struct ArbitrageOpportunity has key, store {
        id: UID,
        pool_a_id: address,
        pool_b_id: address,
        token_pair: String,
        price_a: u64,
        price_b: u64,
        price_difference: u64,
        potential_profit: u64,
        recommended_amount: u64,
        opportunity_type: String, // "dex_arbitrage", "cross_chain", "liquidation"
        created_at: u64,
        expires_at: u64,
        executed: bool,
    }

    struct ArbitrageDetector has key {
        id: UID,
        opportunities: Table<address, ArbitrageOpportunity>,
        registered_pools: vector<address>,
        min_profit_threshold: u64, // in basis points
        max_opportunities: u64,
        admin: address,
    }

    struct PoolInfo has copy, drop, store {
        pool_id: address,
        token_a_type: String,
        token_b_type: String,
        reserve_a: u64,
        reserve_b: u64,
        fee_rate: u64,
        pool_type: String, // "deepbook", "cetus", "turbos", etc.
    }

    // Initialize the arbitrage detection system
    fun init(ctx: &mut TxContext) {
        let oracle = PriceOracle {
            id: object::new(ctx),
            prices: table::new(ctx),
            last_updated: table::new(ctx),
            admin: tx_context::sender(ctx),
        };
        transfer::share_object(oracle);

        let detector = ArbitrageDetector {
            id: object::new(ctx),
            opportunities: table::new(ctx),
            registered_pools: vector::empty<address>(),
            min_profit_threshold: 10, // 0.1% minimum profit
            max_opportunities: 100,
            admin: tx_context::sender(ctx),
        };
        transfer::share_object(detector);
    }

    // Register a new pool for monitoring
    public entry fun register_pool(
        detector: &mut ArbitrageDetector,
        pool_id: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == detector.admin, EUnauthorized);
        if (!vector::contains(&detector.registered_pools, &pool_id)) {
            vector::push_back(&mut detector.registered_pools, pool_id);
        };
    }

    // Update price in oracle
    public entry fun update_price(
        oracle: &mut PriceOracle,
        token_name: String,
        price: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == oracle.admin, EUnauthorized);
        assert!(price > 0, EInvalidPrice);

        let current_time = clock::timestamp_ms(clock);
        
        if (table::contains(&oracle.prices, token_name)) {
            *table::borrow_mut(&mut oracle.prices, token_name) = price;
            *table::borrow_mut(&mut oracle.last_updated, token_name) = current_time;
        } else {
            table::add(&mut oracle.prices, token_name, price);
            table::add(&mut oracle.last_updated, token_name, current_time);
        };
    }

    // Detect DEX arbitrage opportunity
    public fun detect_dex_arbitrage(
        detector: &mut ArbitrageDetector,
        pool_a_info: PoolInfo,
        pool_b_info: PoolInfo,
        clock: &Clock,
        ctx: &mut TxContext
    ): bool {
        // Calculate prices based on AMM formula (x * y = k)
        let price_a = calculate_amm_price(pool_a_info.reserve_a, pool_a_info.reserve_b);
        let price_b = calculate_amm_price(pool_b_info.reserve_a, pool_b_info.reserve_b);

        let price_diff = if (price_a > price_b) {
            price_a - price_b
        } else {
            price_b - price_a
        };

        let relative_diff = (price_diff * 10000) / ((price_a + price_b) / 2);
        
        if (relative_diff > detector.min_profit_threshold) {
            let opportunity_id = create_opportunity(
                detector,
                pool_a_info.pool_id,
                pool_b_info.pool_id,
                string::utf8(b"SUI/USDC"), // Example pair
                price_a,
                price_b,
                price_diff,
                relative_diff,
                1000000, // Recommended amount (1 SUI)
                string::utf8(b"dex_arbitrage"),
                clock,
                ctx
            );

            event::emit(OpportunityDetected {
                detector: tx_context::sender(ctx),
                pool_a: pool_a_info.pool_id,
                pool_b: pool_b_info.pool_id,
                token_pair: string::utf8(b"SUI/USDC"),
                price_difference: price_diff,
                potential_profit: relative_diff,
                recommended_amount: 1000000,
                opportunity_type: string::utf8(b"dex_arbitrage"),
                timestamp: clock::timestamp_ms(clock),
            });

            true
        } else {
            false
        }
    }

    // Detect cross-chain arbitrage (simplified for demo)
    public fun detect_cross_chain_arbitrage(
        detector: &mut ArbitrageDetector,
        oracle: &PriceOracle,
        sui_price: u64,
        external_price: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ): bool {
        let price_diff = if (sui_price > external_price) {
            sui_price - external_price
        } else {
            external_price - sui_price
        };

        let relative_diff = (price_diff * 10000) / ((sui_price + external_price) / 2);

        if (relative_diff > detector.min_profit_threshold * 2) { // Higher threshold for cross-chain
            event::emit(OpportunityDetected {
                detector: tx_context::sender(ctx),
                pool_a: @0x1, // Sui chain
                pool_b: @0x2, // External chain (placeholder)
                token_pair: string::utf8(b"SUI/USD"),
                price_difference: price_diff,
                potential_profit: relative_diff,
                recommended_amount: 5000000, // 5 SUI
                opportunity_type: string::utf8(b"cross_chain"),
                timestamp: clock::timestamp_ms(clock),
            });
            true
        } else {
            false
        }
    }

    // Detect liquidation opportunities
    public fun detect_liquidation_opportunity(
        detector: &mut ArbitrageDetector,
        collateral_value: u64,
        debt_value: u64,
        liquidation_threshold: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ): bool {
        let collateral_ratio = (collateral_value * 10000) / debt_value;
        
        if (collateral_ratio < liquidation_threshold) {
            let profit_potential = (debt_value * 500) / 10000; // 5% liquidation reward

            event::emit(OpportunityDetected {
                detector: tx_context::sender(ctx),
                pool_a: @0x0, // Lending protocol
                pool_b: @0x0,
                token_pair: string::utf8(b"COLLATERAL/DEBT"),
                price_difference: debt_value - collateral_value,
                potential_profit: profit_potential,
                recommended_amount: debt_value,
                opportunity_type: string::utf8(b"liquidation"),
                timestamp: clock::timestamp_ms(clock),
            });
            true
        } else {
            false
        }
    }

    // Helper functions
    fun calculate_amm_price(reserve_a: u64, reserve_b: u64): u64 {
        // Simple price calculation: price = reserve_b / reserve_a
        if (reserve_a == 0) return 0;
        (reserve_b * 1000000) / reserve_a // Scale by 1M for precision
    }

    fun create_opportunity(
        detector: &mut ArbitrageDetector,
        pool_a: address,
        pool_b: address,
        token_pair: String,
        price_a: u64,
        price_b: u64,
        price_diff: u64,
        profit: u64,
        amount: u64,
        opp_type: String,
        clock: &Clock,
        ctx: &mut TxContext
    ): address {
        let opportunity = ArbitrageOpportunity {
            id: object::new(ctx),
            pool_a_id: pool_a,
            pool_b_id: pool_b,
            token_pair,
            price_a,
            price_b,
            price_difference: price_diff,
            potential_profit: profit,
            recommended_amount: amount,
            opportunity_type: opp_type,
            created_at: clock::timestamp_ms(clock),
            expires_at: clock::timestamp_ms(clock) + 300000, // 5 minutes
            executed: false,
        };

        let opp_id = object::uid_to_address(&opportunity.id);
        table::add(&mut detector.opportunities, opp_id, opportunity);
        opp_id
    }

    // View functions
    public fun get_price(oracle: &PriceOracle, token_name: String): u64 {
        if (table::contains(&oracle.prices, token_name)) {
            *table::borrow(&oracle.prices, token_name)
        } else {
            0
        }
    }

    public fun get_registered_pools(detector: &ArbitrageDetector): &vector<address> {
        &detector.registered_pools
    }

    public fun opportunity_count(detector: &ArbitrageDetector): u64 {
        table::length(&detector.opportunities)
    }
}