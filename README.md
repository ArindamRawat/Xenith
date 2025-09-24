# ✦ Xenith ✦
> *A sentiment-driven betting protocol where markets pulse with social emotions*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Aptos](https://img.shields.io/badge/Aptos-Blockchain-purple.svg)](https://aptoslabs.com/)
[![Python](https://img.shields.io/badge/Python-3.13-green.svg)](https://python.org/)

## 🌟 Vision & Mission

**Xenith** (a twist on "Zenith") is a revolutionary sentiment-based prediction market that transforms social media emotions into tradeable signals. By analyzing real-time social sentiment from Reddit, crypto news, and market fear/greed indices, Xenith creates a dynamic betting ecosystem where users can profit from predicting crowd psychology.

### Core Philosophy
- **Democratize Market Intelligence**: Turn social sentiment into actionable trading signals
- **Crowd Wisdom**: Harness collective emotions to predict market movements
- **Transparent & Decentralized**: Built on Aptos blockchain for trustless operations
- **Real-time Analytics**: Live sentiment tracking with historical visualization

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   Blockchain    │
│   (React)       │◄──►│   (Node.js)      │◄──►│   (Aptos)       │
│                 │    │                  │    │                 │
│ • Landing Page  │    │ • Express API    │    │ • Smart Contract│
│ • Dashboard     │    │ • Bet Storage    │    │ • Sentiment Data│
│ • Trading Bot   │    │ • Sentiment API  │    │ • Bet Resolution│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Oracle        │    │   Data Sources  │    │   Analytics     │
│   (Python)      │    │                 │    │                 │
│                 │    │ • Reddit API    │    │ • Sentiment Viz │
│ • Sentiment     │    │ • CoinGecko     │    │ • Trend Analysis│
│ • Analysis      │    │ • Fear & Greed  │    │ • Trading Bots  │
│ • Contract      │    │ • News APIs     │    │ • Leaderboards │
│ • Updates       │    │                 │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Features

### 🎯 Core Functionality
- **Real-time Sentiment Analysis**: Live tracking of social media emotions
- **Prediction Markets**: Bet on sentiment direction (UP/DOWN)
- **Automated Trading Bot**: Simulated trading based on sentiment signals
- **Historical Analytics**: Comprehensive sentiment visualization and trends
- **Leaderboards**: Competitive ranking system for top traders

### 📊 Sentiment Dashboard
- **Live Sentiment Score**: 0-100 scale (Fear to Greed)
- **Trend Analysis**: Up/Down/Stable indicators
- **Trading Signals**: BUY/SELL/HOLD recommendations
- **Contrarian Indicators**: Extreme fear/greed signals
- **Historical Charts**: Time-series sentiment visualization

### 🤖 Trading Bot Simulation
- **Strategy Options**: Follow crowd vs. Inverse crowd
- **Real-time Execution**: Automated position management
- **Performance Tracking**: PnL and equity monitoring
- **Risk Management**: Stop-loss and take-profit logic
- **Backtesting**: Historical strategy validation

### 🏆 Betting System
- **Directional Bets**: Predict sentiment movement
- **Treasury Management**: Automated payout system
- **Position Tracking**: Active bet monitoring
- **Resolution Logic**: Time-based bet settlement
- **Leaderboard Rankings**: Volume and performance metrics

## 🛠️ Technology Stack

### Frontend
- **React 19.1.1**: Modern UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Aptos SDK**: Blockchain integration

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **CORS**: Cross-origin resource sharing
- **JSON Storage**: File-based data persistence

### Blockchain
- **Aptos**: High-performance blockchain
- **Move Language**: Smart contract development
- **Wallet Integration**: Aptos wallet adapter
- **REST API**: Blockchain interaction

### Oracle & Analytics
- **Python 3.13**: Data processing
- **TextBlob**: Natural language processing
- **Requests**: HTTP client
- **Reddit API**: Social media data
- **CoinGecko API**: Crypto market data
- **Fear & Greed Index**: Market sentiment

## 📁 Project Structure

```
Xenith/
├── reactApp/betting-dapp/          # Frontend React Application
│   ├── src/
│   │   ├── App.tsx                 # Main betting interface
│   │   ├── LandingPage.tsx        # Welcome page
│   │   ├── SentimentDashboard.tsx  # Analytics dashboard
│   │   ├── TradingBot.tsx         # Bot simulation
│   │   ├── aptos.ts               # Blockchain integration
│   │   └── main.tsx               # App entry point
│   ├── server/
│   │   ├── server.cjs             # Express API server
│   │   ├── bets.json              # Bet storage
│   │   └── sentiment.json         # Sentiment history
│   └── package.json               # Dependencies & scripts
├── sentimentanalysis/              # Python Oracle System
│   ├── oracle/
│   │   ├── sentiment_oracle.py    # Main oracle script
│   │   ├── requirements.txt       # Python dependencies
│   │   ├── config.json            # Oracle configuration
│   │   └── sentiment_history.json # Historical data
│   └── contract/
│       ├── sources/
│       │   └── sentiment_trading.move # Aptos smart contract
│       └── build/                  # Compiled contracts
└── README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.8+)
- **Aptos CLI** (for contract deployment)
- **Aptos Wallet** (Petra, Martian, etc.)

### Installation & Setup

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd Xenith
```

#### 2. Frontend Setup
```bash
cd reactApp/betting-dapp
npm install
```

#### 3. Python Oracle Setup
```bash
cd sentimentanalysis/oracle
python -m venv myenv
# Windows
myenv\Scripts\activate
# Linux/Mac
source myenv/bin/activate

pip install -r requirements.txt
```

#### 4. Smart Contract Deployment
```bash
cd sentimentanalysis/contract
aptos move compile
aptos move publish
```

### Running the Application

#### Terminal 1: Start the Frontend
```bash
cd reactApp/betting-dapp
npm run dev
```
- Frontend runs on `http://localhost:5173`

#### Terminal 2: Start the Backend Server
```bash
cd reactApp/betting-dapp
npm run server
```
- API server runs on `http://localhost:8787`

#### Terminal 3: Start the Sentiment Oracle
```bash
cd sentimentanalysis/oracle
python sentiment_oracle.py
```
- Oracle runs continuously, updating every 5 minutes

## 🎮 Usage Guide

### Getting Started
1. **Visit the Landing Page**: Navigate to `http://localhost:5173`
2. **Connect Wallet**: Use an Aptos wallet (Petra, Martian, etc.)
3. **Explore Dashboard**: View live sentiment data and trends
4. **Place Bets**: Predict sentiment direction with APT tokens
5. **Run Trading Bot**: Simulate automated trading strategies

### Key Commands

#### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run server       # Start API server
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

#### Oracle Management
```bash
python sentiment_oracle.py    # Start sentiment analysis
# Runs continuously, updates every 5 minutes
# Press Ctrl+C to stop
```

### Smart Contract Functions

#### Core Functions
- `initialize()`: Initialize the sentiment system
- `update_sentiment()`: Oracle updates sentiment data
- `place_sentiment_bet()`: Users place directional bets
- `resolve_bet()`: Resolve and payout winning bets

#### View Functions
- `get_current_sentiment()`: Get live sentiment score
- `get_trading_signal()`: Get buy/sell signals
- `get_user_position()`: Check user's active bets
- `get_treasury_balance()`: Check contract treasury
- `interpret_sentiment()`: Get sentiment interpretation

## 📊 Sentiment Analysis Pipeline

### Data Sources
1. **Reddit API**: r/cryptocurrency posts and comments
2. **CoinGecko News**: Crypto news headlines and descriptions
3. **Fear & Greed Index**: Market sentiment indicator
4. **Social Media Volume**: Post frequency and engagement

### Analysis Process
1. **Data Collection**: Fetch posts from multiple sources
2. **Text Processing**: Clean and normalize text data
3. **Sentiment Scoring**: Use TextBlob for polarity analysis
4. **Weighted Aggregation**: Combine sources with different weights
5. **Trend Calculation**: Compare recent vs. historical scores
6. **Signal Generation**: Create trading recommendations
7. **Blockchain Update**: Update smart contract with results

### Scoring System
- **0-20**: Extreme Fear (Contrarian BUY signal)
- **20-40**: Fear (Potential buying opportunity)
- **40-60**: Neutral (Hold position)
- **60-80**: Greed (Consider taking profits)
- **80-100**: Extreme Greed (Contrarian SELL signal)

## 🎯 Trading Strategies

### Follow the Crowd
- **High Sentiment (70+)**: BUY signal
- **Low Sentiment (30-)**: SELL signal
- **Medium Sentiment**: HOLD

### Inverse Crowd (Contrarian)
- **Extreme Fear (<20)**: BUY (market oversold)
- **Extreme Greed (>80)**: SELL (market overbought)
- **Neutral Zone**: HOLD and observe

### Risk Management
- **Position Sizing**: Risk 1-2% per trade
- **Stop Loss**: 2% maximum loss per position
- **Take Profit**: 2% target profit
- **Time Limits**: 1-hour minimum bet duration

## 🔧 Configuration

### Oracle Settings (`config.json`)
```json
{
  "contract_address": "0x473558faf73c5911531b6514abd4aeb12f6ebc3846a845a9d752fd6884ed65ec",
  "update_interval": 300,
  "data_sources": {
    "reddit_enabled": true,
    "news_enabled": true,
    "fear_greed_enabled": true
  },
  "sentiment_weights": {
    "reddit": 0.4,
    "news": 0.3,
    "fear_greed": 0.3
  }
}
```

### Frontend Configuration
- **RPC URL**: Customizable Aptos node endpoint
- **Update Frequency**: 12-second polling interval
- **Data Retention**: 200 samples locally, 1000 on server

## 🚀 Future Roadmap

### Phase 1: Core Features ✅
- [x] Basic sentiment analysis
- [x] Simple betting interface
- [x] Trading bot simulation
- [x] Historical visualization

### Phase 2: Enhanced Analytics
- [ ] Advanced sentiment indicators
- [ ] Machine learning predictions
- [ ] Multi-timeframe analysis
- [ ] Custom strategy builder

### Phase 3: Social Features
- [ ] User profiles and portfolios
- [ ] Social trading features
- [ ] Community sentiment polls
- [ ] Expert trader following

### Phase 4: Advanced Features
- [ ] Cross-chain integration
- [ ] Advanced derivatives
- [ ] Institutional tools
- [ ] Mobile applications

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Aptos Labs** for the blockchain infrastructure
- **React Team** for the amazing frontend framework
- **Python Community** for excellent data science tools
- **Open Source Contributors** who make projects like this possible

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join our community discussions
- **Discord**: [Join our Discord server]

---

**Built with ❤️ by the Xenith Team**

*"Where sentiment meets strategy, and emotions become opportunities."*

