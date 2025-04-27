# Flakies POS - Frontend

## Overview

Flakies POS is a scalable, modular Point of Sale system designed for the Kenyan market. This repository contains the Vue.js frontend application that provides intuitive interfaces for restaurants, supermarkets, and hotels.

## Features

- **Intuitive Dashboard**: Real-time sales analytics and business insights
- **Multi-industry Support**: Customized interfaces for restaurants, retail, and hospitality
- **Inventory Management**: Track stock levels, set alerts, and manage suppliers
- **User Management**: Role-based access control for different staff levels
- **AI-Powered**: Sales forecasting and personalized recommendations
- **Mobile Responsive**: Works on tablets, phones, and desktop computers
- **Offline Mode**: Continue operations even without internet connectivity
- **Multilingual**: Support for English and Kiswahili

## Tech Stack

- **Vue.js 3**: Progressive JavaScript framework
- **Vuex**: State management
- **Vue Router**: Client-side routing
- **Vuetify**: Material Design component framework
- **Axios**: HTTP client for API requests
- **Chart.js**: Data visualization
- **IndexedDB**: Offline data storage

## Project Structure


## Setup Instructions

### Prerequisites

- Node.js (v14.x or later)
- npm (v6.x or later) or yarn (v1.22.x or later)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/flakies-pos-frontend.git
   cd flakies-pos-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   VUE_APP_API_URL=http://localhost:5000/api
   VUE_APP_MPESA_CLIENT_ID=your_mpesa_client_id
   VUE_APP_VERSION=1.0.0
   ```

### Development

Run the development server:
```bash
npm run serve
# or
yarn serve
```

The application will be available at `http://localhost:8080`.

### Building for Production

```bash
npm run build
# or
yarn build
```

This will generate optimized production files in the `dist/` directory.

## Testing

### Unit Tests

```bash
npm run test:unit
# or
yarn test:unit
```

### End-to-End Tests

```bash
npm run test:e2e
# or
yarn test:e2e
```

## Deployment

The frontend application can be deployed to various hosting services:

### Vercel

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

### Netlify

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder using the Netlify CLI or GUI.

## Connecting to Backend

The frontend application is designed to work with the Flakies POS backend API. Make sure to update the `VUE_APP_API_URL` in your `.env` file to point to your deployed backend service.

## Industry-Specific Modules

### Restaurant Module

The restaurant module includes:
- Table management
- Order taking
- Kitchen display system integration
- Split bill functionality

### Retail Module

The retail module includes:
- Barcode scanning
- Product catalog
- Batch discounts
- Expiry date tracking

### Hotel Module

The hotel module includes:
- Room booking
- Check-in/check-out process
- Housekeeping integration
- Guest management

## Payment Integration

Flakies POS supports multiple payment methods:
- M-Pesa (Safaricom)
- PesaLink
- Stripe (for card payments)
- Cash

## Offline Mode

The application uses IndexedDB to store transaction data when offline. Once connection is restored, the app automatically synchronizes with the backend.

## Multilingual Support

To switch between languages:
1. Click on the language icon in the navigation bar
2. Select your preferred language (English or Kiswahili)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support or inquiries, please contact:
- Email: support@flakies.com
- Phone: +254 XXX XXX XXX