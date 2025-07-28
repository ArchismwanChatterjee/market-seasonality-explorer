# Market Seasonality Explorer 📈

An interactive web application for visualizing and analyzing cryptocurrency market seasonality patterns using real-time data from the Binance API. Explore historical volatility, volume, and performance data through an intuitive calendar interface. Check it out [here](https://market-seasonality-explore.netlify.app/)

![Market Seasonality Explorer](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)
![Binance API](https://img.shields.io/badge/Binance_API-Live_Data-F0B90B?style=for-the-badge&logo=binance)

## Features

###  Interactive Calendar Visualization
- **Daily View**: Detailed day-by-day market analysis with color-coded volatility indicators
- **Weekly View**: Aggregated weekly performance metrics and trends
- **Monthly View**: High-level monthly market overview and comparisons
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

###  Customizable Themes
- **Default Theme**: Standard vibrant color scheme
- **High Contrast**: Black and white for better visibility
- **Colorblind Friendly**: Blue-orange palette safe for color vision deficiency
- **Dark Mode**: Optimized for low-light environments
- **Monochrome**: Grayscale theme for minimal distraction

###  Advanced Analytics
- **Pattern Recognition**: Automatic detection of recurring market patterns
- **Volatility Analysis**: Real-time volatility calculations and clustering detection
- **Volume Analysis**: Trading volume spikes and trend identification
- **Performance Metrics**: Comprehensive return and risk analysis

###  Market Comparison Tools
- **Time Period Comparison**: Compare same symbol across different time periods
- **Symbol Comparison**: Compare different cryptocurrencies side-by-side
- **Historical Analysis**: Access data back to Binance launch (July 2017)
- **Statistical Significance**: Confidence levels and occurrence tracking

### Smart Alert System
- **Custom Alerts**: Set volatility, performance, and volume thresholds
- **Real-time Notifications**: Browser notifications for triggered alerts
- **Pattern Alerts**: Notifications for detected market anomalies
- **Alert Management**: Enable/disable and reset alert states

### Export & Sharing
- **CSV Export**: Raw market data with all metrics
- **PDF Reports**: Formatted reports with charts and analysis
- **PNG Images**: High-quality calendar visualizations
- **Custom Date Ranges**: Export specific time periods

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm package manager
- Modern web browser with JavaScript enabled

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ArchismwanChatterjee/market-seasonality-explorer.git
   ```

2. **Install dependencies**
   ```bash
   npm install
    ```

3. **Start the development server**
   ```bash
   npm run dev
    ```
4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui
- **Charts**: Recharts for data visualization
- **Date Handling**: date-fns for robust date operations
- **API**: Binance REST API for real-time market data

### Project Structure
```
market-seasonality-explorer/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles and Tailwind config
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   ├── calendar.tsx      # Main calendar component
│   ├── calendar-cell.tsx # Individual calendar cell
│   ├── data-dashboard.tsx # Analytics dashboard
│   ├── control-panel.tsx # Navigation and controls
│   ├── pattern-analyzer.tsx # Pattern detection
│   ├── comparison-dialog.tsx # Market comparison
│   ├── alert-system.tsx  # Alert management
│   └── export-dialog.tsx # Data export functionality
├── hooks/                # Custom React hooks
│   └── use-market-data.ts # Market data fetching and processing
├── contexts/             # React contexts
│   └── theme-context.tsx # Theme and color scheme management
├── types/                # TypeScript type definitions
│   └── market.ts         # Market data interfaces
├── lib/                  # Utility libraries
│   └── binance-api.ts    # Binance API utilities
└── README.md            # This file
```

## Data Sources

### Binance API Integration
- **Endpoint**: Binance REST API v3
- **Data Types**: OHLCV (Open, High, Low, Close, Volume) daily data
- **Rate Limiting**: 1200 requests per minute with intelligent queuing
- **Historical Range**: July 2017 to present
- **Supported Pairs**: 15+ major cryptocurrency trading pairs

### Supported Trading Pairs
- **Bitcoin (BTC/USDT)** - The original cryptocurrency
- **Ethereum (ETH/USDT)** - Smart contract platform
- **Binance Coin (BNB/USDT)** - Exchange native token
- **Cardano (ADA/USDT)** - Proof-of-stake blockchain
- **Solana (SOL/USDT)** - High-performance blockchain
- **Ripple (XRP/USDT)** - Digital payment protocol
- **Polkadot (DOT/USDT)** - Multi-chain protocol
- **Avalanche (AVAX/USDT)** - Scalable blockchain platform
- **Polygon (MATIC/USDT)** - Ethereum scaling solution
- **Chainlink (LINK/USDT)** - Decentralized oracle network
- **Uniswap (UNI/USDT)** - Decentralized exchange token
- **Litecoin (LTC/USDT)** - Digital silver
- **Bitcoin Cash (BCH/USDT)** - Bitcoin fork
- **Stellar (XLM/USDT)** - Cross-border payments
- **VeChain (VET/USDT)** - Supply chain blockchain

##  Usage Guide

### Basic Navigation
1. **Select Trading Pair**: Choose from 15+ supported cryptocurrency pairs
2. **Choose Time Period**: Navigate to any month from July 2017 to present
3. **Select View Mode**: Switch between Daily, Weekly, or Monthly views
4. **Explore Data**: Click on dates to see detailed analytics

### Advanced Features

#### Pattern Analysis
- Automatically detects recurring patterns in market data
- Identifies weekly, monthly, and volatility patterns
- Shows confidence levels and historical occurrences
- Highlights market anomalies and unusual behavior

#### Market Comparison
- **Time Comparison**: Compare same symbol across different periods
- **Symbol Comparison**: Compare different cryptocurrencies
- **Custom Date Ranges**: Select specific periods for analysis
- **Statistical Metrics**: View detailed comparison statistics

#### Alert System
- Set custom thresholds for volatility, performance, and volume
- Receive browser notifications when alerts trigger
- Manage multiple alerts with enable/disable functionality
- Track alert history and reset triggered alerts

#### Data Export
- **CSV Format**: Raw data with all calculated metrics
- **PDF Reports**: Professional reports with charts and analysis
- **PNG Images**: High-resolution calendar visualizations
- **Custom Options**: Include/exclude charts and metrics

### Keyboard Shortcuts
- **Arrow Keys**: Navigate calendar dates
- **Escape**: Clear date selection
- **Option/Alt + D**: Toggle design mode (when available)

##  Customization

### Color Schemes
The application supports multiple color schemes for different accessibility needs:

- **Default**: Standard vibrant colors for general use
- **High Contrast**: Black and white for users with visual impairments
- **Colorblind Friendly**: Blue-orange palette safe for most color vision types
- **Dark Mode**: Reduced eye strain for low-light environments
- **Monochrome**: Grayscale theme for focus on data patterns

### Responsive Design
- **Mobile First**: Optimized for mobile devices with touch-friendly interfaces
- **Tablet Support**: Enhanced layouts for tablet screens
- **Desktop Experience**: Full-featured interface with expanded views
- **Layout Modes**: Standard and expanded layouts for different use cases

## 🔧 Configuration

### API Rate Limiting
The application includes built-in rate limiting to comply with Binance API limits:
- Maximum 1200 requests per minute
- Intelligent request queuing
- Automatic retry with exponential backoff
- Error handling for rate limit exceeded

### Browser Compatibility
- **Chrome**: 90+ (recommended)
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## Performance

### Optimization Features
- **Data Caching**: Intelligent caching of API responses
- **Lazy Loading**: Components load on demand
- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Optimized images and assets
- **Bundle Analysis**: Optimized bundle size

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

##  Development

### Available Scripts
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Code Quality
- **TypeScript**: Full type safety with strict mode
- **ESLint**: Code linting with Next.js recommended rules
- **Prettier**: Consistent code formatting

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```
---
