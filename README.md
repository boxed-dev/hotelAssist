
# Hotel Assistant

Hotel Assistant is an AI-powered chatbot designed to help with hotel bookings and inquiries for Taj Hotel. It uses advanced language models and a custom database to provide accurate and helpful responses to user queries.

## Features

- User search and management
- Room booking and availability checks
- Booking management (creation, cancellation, and retrieval)
- Integration with OpenAI's GPT-4 for natural language processing
- Custom tools for database operations

## Prerequisites

- Node.js (version 18 or higher)
- Yarn package manager

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/hotel-assistant.git
   cd hotel-assistant
   ```

2. Install dependencies:
   ```
   yarn install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following variables:

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   SERPER_API_KEY=your_serper_api_key_here
   ```

   Replace `your_openai_api_key_here` and `your_serper_api_key_here` with your actual API keys.

## Usage

1. Start the development server:
   ```
   yarn dev
   ```

2. Open your browser and navigate to `http://localhost:3000` to use the Hotel Assistant.

## Project Structure

- `app/`: Contains the main application code
  - `api/`: API routes and serverless functions
  - `chat/`: Chat-related components and logic
  - `agents/`: Agent definitions and tools
- `data/`: CSV files for users, rooms, and bookings
- `public/`: Static assets
- `styles/`: CSS and styling files

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- LangChain
- OpenAI GPT-4
