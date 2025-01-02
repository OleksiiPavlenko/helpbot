# Telegram Help Bot

## Overview

The Telegram Help Bot is designed to assist users in Ukraine who need help during emergencies. This bot enables users to submit requests for assistance by providing their location and address. It integrates with Google Sheets to store user information and requests, allowing for organized tracking and response to those in need.

## Features

- **User Interaction**: Engages users with a friendly greeting and options to request help or decline assistance.
- **Location Submission**: Prompts users to provide their city and specific address requiring assistance.
- **Data Storage**: Collects user information and requests, storing them in a Google Sheet for easy access and management.
- **Confirmation Process**: Validates the user's inputs for the city and address before final submission.
- **Error Handling**: Provides feedback and prompts to guide users in case of incorrect input or issues during the process.

## Functionality

1. **Start Command**: Initializes the conversation and presents options to the user.
2. **City Submission**: Collects the city name from the user and confirms it.
3. **Address Submission**: Collects the specific address and confirms its accuracy.
4. **Data Writing**: Upon confirmation, the bot writes the collected data to a designated Google Sheet.
5. **Session Management**: Uses session management to track user input throughout the conversation.
6. **Error Handling**: Includes mechanisms to handle errors gracefully and provide user-friendly messages.

## Requirements

- Node.js
- Telegram Bot API token
- Google Sheets API credentials (including `credentials.json` and `token.json`)

## Installation

1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/yourusername/telegram-help-bot.git
   cd telegram-help-bot
   node bot.js
