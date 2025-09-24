module sentiment_trading::emotion_signals {
    use std::signer;
    use aptos_framework::timestamp;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;

    // Sentiment levels: 0-20 (extreme fear) to 80-100 (extreme greed)
    struct SentimentData has key {
        current_score: u8,        // 0-100 sentiment score
        last_update: u64,         // timestamp
        trend: u8,                // 0=down, 1=stable, 2=up
        volume_weight: u64,       // social media volume multiplier
    }

    struct TradingSignal has key {
        signal_type: u8,          // 0=sell, 1=hold, 2=buy
        confidence: u8,           // 0-100 confidence level
        strategy: u8,             // 0=follow_crowd, 1=inverse_crowd
        generated_at: u64,
    }

    struct UserPosition has key {
        bet_amount: u64,
        predicted_direction: u8,  // 0=down, 1=up
        entry_sentiment: u8,
        entry_time: u64,
        is_active: bool,
    }

    // Oracle admin capability
    struct OracleCapability has key {}

    // Treasury to hold betting funds
    struct Treasury has key {
        funds: coin::Coin<AptosCoin>,
    }

    // Initialize the sentiment system
    public entry fun initialize(admin: &signer) {
        move_to(admin, OracleCapability {});
        move_to(admin, Treasury {
            funds: coin::zero<AptosCoin>(),
        });
        move_to(admin, SentimentData {
            current_score: 50,  // neutral
            last_update: timestamp::now_seconds(),
            trend: 1,           // stable
            volume_weight: 100,
        });
        move_to(admin, TradingSignal {
            signal_type: 1,     // hold
            confidence: 50,
            strategy: 0,        // follow crowd
            generated_at: timestamp::now_seconds(),
        });
    }

    // Oracle updates sentiment data (called by off-chain script)
    public entry fun update_sentiment(
        admin: &signer,
        new_score: u8,
        trend: u8,
        volume: u64
    ) acquires SentimentData, TradingSignal {
        // Verify oracle permission
        assert!(exists<OracleCapability>(signer::address_of(admin)), 1);
        
        let sentiment = borrow_global_mut<SentimentData>(signer::address_of(admin));
        sentiment.current_score = new_score;
        sentiment.last_update = timestamp::now_seconds();
        sentiment.trend = trend;
        sentiment.volume_weight = volume;

        // Generate trading signals based on sentiment
        generate_signals(admin, new_score, trend);
    }

    // Generate buy/sell signals based on sentiment
    fun generate_signals(admin: &signer, score: u8, trend: u8) acquires TradingSignal {
        let signal = borrow_global_mut<TradingSignal>(signer::address_of(admin));
        
        // Strategy 1: Follow the crowd
        if (score > 70) {
            signal.signal_type = 2; // buy (greed)
            signal.confidence = score;
        } else if (score < 30) {
            signal.signal_type = 0; // sell (fear)
            signal.confidence = 100 - score;
        } else {
            signal.signal_type = 1; // hold
            signal.confidence = 50;
        };

        // Strategy 2: Inverse crowd (contrarian)
        // When extreme fear (score < 20), suggest buy
        // When extreme greed (score > 80), suggest sell
        
        signal.generated_at = timestamp::now_seconds();
    }

    // Users can bet on sentiment predictions
    public entry fun place_sentiment_bet(
        user: &signer,
        predicted_direction: u8, // 0=sentiment will decrease, 1=increase
        amount: u64
    ) acquires SentimentData, Treasury {
        let user_addr = signer::address_of(user);
        let sentiment = borrow_global<SentimentData>(@sentiment_trading);
        
        // Take payment and add to treasury
        let payment = coin::withdraw<AptosCoin>(user, amount);
        let treasury = borrow_global_mut<Treasury>(@sentiment_trading);
        coin::merge(&mut treasury.funds, payment);

        // Store user's bet
        move_to(user, UserPosition {
            bet_amount: amount,
            predicted_direction,
            entry_sentiment: sentiment.current_score,
            entry_time: timestamp::now_seconds(),
            is_active: true,
        });
    }

    // Resolve bets after time period
    public entry fun resolve_bet(user: &signer) acquires UserPosition, SentimentData, Treasury {
        let user_addr = signer::address_of(user);
        let position = borrow_global_mut<UserPosition>(user_addr);
        let sentiment = borrow_global<SentimentData>(@sentiment_trading);
        
        assert!(position.is_active, 2);
        assert!(timestamp::now_seconds() > position.entry_time + 3600, 3); // 1 hour minimum
        
        let won = false;
        if (position.predicted_direction == 1 && sentiment.current_score > position.entry_sentiment) {
            won = true;
        } else if (position.predicted_direction == 0 && sentiment.current_score < position.entry_sentiment) {
            won = true;
        };

        if (won) {
            // Pay out 1.8x the bet from treasury
            let treasury = borrow_global_mut<Treasury>(@sentiment_trading);
            let payout_amount = position.bet_amount * 18 / 10;
            
            // Check if treasury has enough funds
            if (coin::value(&treasury.funds) >= payout_amount) {
                let payout = coin::extract(&mut treasury.funds, payout_amount);
                coin::deposit(user_addr, payout);
            } else {
                // Fallback: pay what's available
                let available = coin::extract_all(&mut treasury.funds);
                coin::deposit(user_addr, available);
            };
        };

        position.is_active = false;
    }

    // View functions
    #[view]
    public fun get_current_sentiment(): (u8, u8, u64) acquires SentimentData {
        let sentiment = borrow_global<SentimentData>(@sentiment_trading);
        (sentiment.current_score, sentiment.trend, sentiment.last_update)
    }

    #[view]
    public fun get_trading_signal(): (u8, u8, u64) acquires TradingSignal {
        let signal = borrow_global<TradingSignal>(@sentiment_trading);
        (signal.signal_type, signal.confidence, signal.generated_at)
    }

    #[view]
    public fun get_user_position(user_addr: address): (u64, u8, u8, bool) acquires UserPosition {
        if (!exists<UserPosition>(user_addr)) {
            return (0, 0, 0, false)
        };
        let position = borrow_global<UserPosition>(user_addr);
        (position.bet_amount, position.predicted_direction, position.entry_sentiment, position.is_active)
    }

    #[view]
    public fun get_treasury_balance(): u64 acquires Treasury {
        let treasury = borrow_global<Treasury>(@sentiment_trading);
        coin::value(&treasury.funds)
    }

    // Get sentiment interpretation
    #[view]
    public fun interpret_sentiment(score: u8): vector<u8> {
        if (score < 20) {
            b"EXTREME FEAR - Contrarian BUY signal"
        } else if (score < 40) {
            b"FEAR - Potential buying opportunity"
        } else if (score < 60) {
            b"NEUTRAL - Hold position"
        } else if (score < 80) {
            b"GREED - Consider taking profits"
        } else {
            b"EXTREME GREED - Contrarian SELL signal"
        }
    }
}