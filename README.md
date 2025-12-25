
# Gemini Flashcard Pro - Local Setup

This app is an AI-powered flashcard generator. To run it locally, follow these steps:

## Prerequisites
- [Node.js](https://nodejs.org/) (Version 18 or higher recommended)

## Setup Instructions
1. **Clone/Download** the project files into a folder.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Get an API Key**:
   Visit [Google AI Studio](https://aistudio.google.com/) to generate a free Gemini API key.

4. **Run the Development Server**:
   You must pass your API key as an environment variable so the app can communicate with Gemini:
   ```bash
   API_KEY=your_key_here npm run dev
   ```
   *Windows (Command Prompt):*
   ```cmd
   set API_KEY=your_key_here && npm run dev
   ```
   *Windows (PowerShell):*
   ```powershell
   $env:API_KEY="your_key_here"; npm run dev
   ```

5. **Open the App**:
   Navigate to `http://localhost:5173` in your browser.

## Project Features
- **AI Generation**: Uses Gemini 3 to create cards from topics or snippets.
- **Interactive Coding**: Practice Python directly on the cards.
- **Markdown Support**: Beautifully formatted deep-dive explanations.
- **Local Persistence**: Your decks are saved to your browser's LocalStorage.
