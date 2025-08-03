# Lenny - Language Learning Discord Bot

## Overview
Lenny is a Discord bot designed for a public server dedicated to language learning. It aims to foster an engaging community by providing tools and features to assist users in practicing and learning languages. Lenny will include commands to interact with users, facilitate language-related activities, and incorporate security features to ensure a safe and welcoming environment.

## Features
- **Basic Commands**: Currently supports `!ping` (responds with "Pong!") and `!hello` (greets users).
- **Future Plans**:
  - Language learning tools (e.g., vocabulary quizzes, translation challenges).
  - Interactive features to connect users for language practice.
  - Security features to moderate content and protect user privacy.
  - Slash command support for a modern Discord experience.

## Installation
Follow these steps to set up Lenny on your local machine or server.

### Prerequisites
- [Node.js](https://nodejs.org/) (version 16 or higher)
- A Discord account and a bot application created via the [Discord Developer Portal](https://discord.com/developers/applications)
- Git (optional, for cloning the repository)

### Setup
1. **Clone the Repository** (if using Git):
   ```bash
   git clone https://github.com/your-username/lenny.git
   cd lenny
   ```

2. **Install Dependencies**:
   Run the following command to install required packages:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   - Create a `.env` file in the project root.
   - Add your Discord bot token (obtained from the Discord Developer Portal):
     ```
     DISCORD_TOKEN=your_discord_bot_token_here
     ```
   - Ensure `.env` is listed in `.gitignore` to prevent it from being uploaded to GitHub.

4. **Run the Bot**:
   Start the bot with:
   ```bash
   npm start
   ```
   The bot should log in and display `Logged in as Lenny#1234` in the console.

5. **Invite the Bot to Your Server**:
   - In the Discord Developer Portal, go to your bot's application, navigate to the "OAuth2" tab, and generate an invite link with the required permissions (e.g., "Send Messages," "Read Messages").
   - Use the link to add Lenny to your Discord server.

## Usage
Once Lenny is in your server, you can use the following commands:
- `!ping`: Responds with "Pong!" to verify the bot is online.
- `!hello`: Greets the user with a friendly message.

More commands for language learning and community interaction will be added in future updates.

## Contributing
Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make your changes and commit them (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

Please ensure your code follows the project's coding style and includes appropriate documentation.

## Security
Lenny is being developed with security in mind to ensure a safe environment for language learners. Planned security features include:
- Message moderation to prevent inappropriate content.
- User verification to maintain a trusted community.
- Rate limiting to prevent abuse of bot commands.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact
For questions, suggestions, or issues, please open an issue on the [GitHub repository](https://github.com/your-username/lenny) or contact the project maintainer.

Happy language learning with Lenny!