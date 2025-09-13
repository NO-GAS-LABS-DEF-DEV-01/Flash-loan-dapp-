#[test_only]
module sui_flash_loan::flash_loan_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock;
    use sui_flash_loan::flash_loan::{Self, LiquidityPool, FlashLoan};

    const ADMIN: address = @0xADMIN;
    const USER: address = @0xUSER;

    #[test]
    fun test_create_pool_success() {
        let scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        // Create initial coin for pool
        let initial_coin = coin::mint_for_testing<SUI>(1000000000, test_scenario::ctx(scenario)); // 1 SUI
        
        // Create pool
        flash_loan::create_pool<SUI>(
            initial_coin,
            30, // 0.3% fee
            500000000, // 0.5 SUI max loan
            test_scenario::ctx(scenario)
        );
        
        test_scenario::next_tx(scenario, ADMIN);
        
        // Verify pool creation
        assert!(test_scenario::has_most_recent_shared<LiquidityPool<SUI>>(), 0);
        
        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_flash_loan_borrow_repay_success() {
        let scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        // Setup: Create pool
        let initial_coin = coin::mint_for_testing<SUI>(1000000000, test_scenario::ctx(scenario));
        flash_loan::create_pool<SUI>(initial_coin, 30, 500000000, test_scenario::ctx(scenario));
        
        test_scenario::next_tx(scenario, USER);
        
        // Create clock for testing
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));
        
        // Get the pool
        let pool = test_scenario::take_shared<LiquidityPool<SUI>>(scenario);
        
        // Test: Borrow flash loan
        let borrow_amount = 100000000; // 0.1 SUI
        let (borrowed_coin, loan) = flash_loan::borrow<SUI>(
            &mut pool,
            borrow_amount,
            &clock,
            test_scenario::ctx(scenario)
        );
        
        // Verify borrowed amount
        assert!(coin::value(&borrowed_coin) == borrow_amount, 1);
        
        // Calculate fee and create repayment
        let fee = (borrow_amount * 30) / 10000; // 0.3% fee
        let repayment_coin = coin::mint_for_testing<SUI>(
            borrow_amount + fee,
            test_scenario::ctx(scenario)
        );
        coin::join(&mut repayment_coin, borrowed_coin);
        
        // Test: Repay flash loan
        flash_loan::repay<SUI>(&mut pool, repayment_coin, loan, &clock, test_scenario::ctx(scenario));
        
        // Cleanup
        test_scenario::return_shared(pool);
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = 0)] // EInsufficientBalance
    fun test_borrow_exceeds_pool_balance() {
        let scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        // Setup: Create small pool
        let initial_coin = coin::mint_for_testing<SUI>(100000000, test_scenario::ctx(scenario)); // 0.1 SUI
        flash_loan::create_pool<SUI>(initial_coin, 30, 1000000000, test_scenario::ctx(scenario)); // 1 SUI max
        
        test_scenario::next_tx(scenario, USER);
        
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));
        let pool = test_scenario::take_shared<LiquidityPool<SUI>>(scenario);
        
        // Test: Try to borrow more than available
        let (borrowed_coin, loan) = flash_loan::borrow<SUI>(
            &mut pool,
            200000000, // 0.2 SUI (more than pool has)
            &clock,
            test_scenario::ctx(scenario)
        );
        
        // Should not reach here
        coin::destroy_for_testing(borrowed_coin);
        flash_loan::test_destroy_loan(loan); // Helper function for testing
        test_scenario::return_shared(pool);
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = 4)] // EMaxLoanExceeded
    fun test_borrow_exceeds_max_loan() {
        let scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        // Setup: Create pool with low max loan
        let initial_coin = coin::mint_for_testing<SUI>(1000000000, test_scenario::ctx(scenario)); // 1 SUI
        flash_loan::create_pool<SUI>(initial_coin, 30, 50000000, test_scenario::ctx(scenario)); // 0.05 SUI max
        
        test_scenario::next_tx(scenario, USER);
        
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));
        let pool = test_scenario::take_shared<LiquidityPool<SUI>>(scenario);
        
        // Test: Try to borrow more than max allowed
        let (borrowed_coin, loan) = flash_loan::borrow<SUI>(
            &mut pool,
            100000000, // 0.1 SUI (more than max allowed)
            &clock,
            test_scenario::ctx(scenario)
        );
        
        // Should not reach here
        coin::destroy_for_testing(borrowed_coin);
        flash_loan::test_destroy_loan(loan);
        test_scenario::return_shared(pool);
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = 1)] // EInvalidRepayment
    fun test_repay_insufficient_amount() {
        let scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        // Setup
        let initial_coin = coin::mint_for_testing<SUI>(1000000000, test_scenario::ctx(scenario));
        flash_loan::create_pool<SUI>(initial_coin, 30, 500000000, test_scenario::ctx(scenario));
        
        test_scenario::next_tx(scenario, USER);
        
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));
        let pool = test_scenario::take_shared<LiquidityPool<SUI>>(scenario);
        
        // Borrow
        let borrow_amount = 100000000;
        let (borrowed_coin, loan) = flash_loan::borrow<SUI>(
            &mut pool,
            borrow_amount,
            &clock,
            test_scenario::ctx(scenario)
        );
        
        // Try to repay with insufficient amount (missing fee)
        coin::destroy_for_testing(borrowed_coin);
        let insufficient_repayment = coin::mint_for_testing<SUI>(
            borrow_amount, // Missing fee
            test_scenario::ctx(scenario)
        );
        
        flash_loan::repay<SUI>(&mut pool, insufficient_repayment, loan, &clock, test_scenario::ctx(scenario));
        
        // Should not reach here
        test_scenario::return_shared(pool);
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_pool_stats() {
        let scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        // Setup
        let initial_amount = 1000000000;
        let initial_coin = coin::mint_for_testing<SUI>(initial_amount, test_scenario::ctx(scenario));
        flash_loan::create_pool<SUI>(initial_coin, 30, 500000000, test_scenario::ctx(scenario));
        
        test_scenario::next_tx(scenario, USER);
        
        let pool = test_scenario::take_shared<LiquidityPool<SUI>>(scenario);
        
        // Test pool balance
        assert!(flash_loan::pool_balance(&pool) == initial_amount, 2);
        
        // Test fee rate
        assert!(flash_loan::pool_fee_rate(&pool) == 30, 3);
        
        // Test initial stats
        let (total_loans, total_fees, active) = flash_loan::pool_stats(&pool);
        assert!(total_loans == 0, 4);
        assert!(total_fees == 0, 5);
        assert!(active == true, 6);
        
        test_scenario::return_shared(pool);
        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_multiple_flash_loans() {
        let scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;
        
        // Setup large pool
        let initial_coin = coin::mint_for_testing<SUI>(10000000000, test_scenario::ctx(scenario)); // 10 SUI
        flash_loan::create_pool<SUI>(initial_coin, 30, 1000000000, test_scenario::ctx(scenario)); // 1 SUI max
        
        test_scenario::next_tx(scenario, USER);
        
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));
        let pool = test_scenario::take_shared<LiquidityPool<SUI>>(scenario);
        
        // Execute multiple flash loans
        let borrow_amount = 100000000; // 0.1 SUI
        let fee = (borrow_amount * 30) / 10000;
        
        // First loan
        let (borrowed_coin1, loan1) = flash_loan::borrow<SUI>(&mut pool, borrow_amount, &clock, test_scenario::ctx(scenario));
        let repayment1 = coin::mint_for_testing<SUI>(borrow_amount + fee, test_scenario::ctx(scenario));
        coin::join(&mut repayment1, borrowed_coin1);
        flash_loan::repay<SUI>(&mut pool, repayment1, loan1, &clock, test_scenario::ctx(scenario));
        
        // Second loan
        let (borrowed_coin2, loan2) = flash_loan::borrow<SUI>(&mut pool, borrow_amount, &clock, test_scenario::ctx(scenario));
        let repayment2 = coin::mint_for_testing<SUI>(borrow_amount + fee, test_scenario::ctx(scenario));
        coin::join(&mut repayment2, borrowed_coin2);
        flash_loan::repay<SUI>(&mut pool, repayment2, loan2, &clock, test_scenario::ctx(scenario));
        
        // Check stats
        let (total_loans, total_fees, _active) = flash_loan::pool_stats(&pool);
        assert!(total_loans == 2, 7);
        assert!(total_fees == fee * 2, 8);
        
        test_scenario::return_shared(pool);
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario_val);
    }
}