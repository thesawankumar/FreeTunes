<p align="center">
    <h1 align="center">FREETUNES</h1>
</p>
<p align="center">
    <em><code>❯ An alternative to Spotify</code></em>
</p>
<p align="center">
	<img src="https://img.shields.io/github/license/NikantYadav/FreeTunes?style=flat&logo=opensourceinitiative&logoColor=white&color=0080ff" alt="license">
	<img src="https://img.shields.io/github/last-commit/NikantYadav/FreeTunes?style=flat&logo=git&logoColor=white&color=0080ff" alt="last-commit">
	<img src="https://img.shields.io/github/languages/top/NikantYadav/FreeTunes?style=flat&color=0080ff" alt="repo-top-language">
	<img src="https://img.shields.io/github/languages/count/NikantYadav/FreeTunes?style=flat&color=0080ff" alt="repo-language-count">
</p>
<p align="center">
		<em>Built with the tools and technologies:</em>
</p>
<p align="center">
	<img src="https://img.shields.io/badge/precommit-FAB040.svg?style=flat&logo=pre-commit&logoColor=black" alt="precommit">
	<img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black" alt="JavaScript">
	<img src="https://img.shields.io/badge/Prettier-F7B93E.svg?style=flat&logo=Prettier&logoColor=black" alt="Prettier">
	<img src="https://img.shields.io/badge/HTML5-E34F26.svg?style=flat&logo=HTML5&logoColor=white" alt="HTML5">
	<img src="https://img.shields.io/badge/YAML-CB171E.svg?style=flat&logo=YAML&logoColor=white" alt="YAML">
	<img src="https://img.shields.io/badge/Chai-A30701.svg?style=flat&logo=Chai&logoColor=white" alt="Chai">
	<img src="https://img.shields.io/badge/Mocha-8D6748.svg?style=flat&logo=Mocha&logoColor=white" alt="Mocha">
	<img src="https://img.shields.io/badge/PowerShell-5391FE.svg?style=flat&logo=PowerShell&logoColor=white" alt="PowerShell">
	<img src="https://img.shields.io/badge/ESLint-4B32C3.svg?style=flat&logo=ESLint&logoColor=white" alt="ESLint">
	<br>
	<img src="https://img.shields.io/badge/Coveralls-3F5767.svg?style=flat&logo=Coveralls&logoColor=white" alt="Coveralls">
	<img src="https://img.shields.io/badge/SemVer-3F4551.svg?style=flat&logo=SemVer&logoColor=white" alt="SemVer">
	<img src="https://img.shields.io/badge/Python-3776AB.svg?style=flat&logo=Python&logoColor=white" alt="Python">
	<img src="https://img.shields.io/badge/tsnode-3178C6.svg?style=flat&logo=ts-node&logoColor=white" alt="tsnode">
	<img src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=flat&logo=TypeScript&logoColor=white" alt="TypeScript">
	<img src="https://img.shields.io/badge/Express-000000.svg?style=flat&logo=Express&logoColor=white" alt="Express">
	<img src="https://img.shields.io/badge/Markdown-000000.svg?style=flat&logo=Markdown&logoColor=white" alt="Markdown">
	<img src="https://img.shields.io/badge/JSON-000000.svg?style=flat&logo=JSON&logoColor=white" alt="JSON">
</p>

<br>



Here’s the updated README file that includes the correct backend setup instructions using FastAPI:

---

# FreeTunes

**An alternative to Spotify**

[![License](https://img.shields.io/github/license/NikantYadav/FreeTunes)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/NikantYadav/FreeTunes)](https://github.com/NikantYadav/FreeTunes/commits/main)
[![Top Language](https://img.shields.io/github/languages/top/NikantYadav/FreeTunes)](https://github.com/NikantYadav/FreeTunes/search?l=javascript)
[![Language Count](https://img.shields.io/github/languages/count/NikantYadav/FreeTunes)](https://github.com/NikantYadav/FreeTunes)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Modules](#modules)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Usage](#usage)
- [Project Roadmap](#project-roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Overview

FreeTunes is a streaming music platform designed to offer a unique and engaging music discovery experience. The project aims to provide users with a diverse range of music while enhancing their enjoyment through personalized recommendations.

The platform allows users to access songs from YouTube and features a backend that ensures smooth and efficient streaming.

## Features

- **Music Streaming**: Stream a wide variety of songs directly from YouTube.
- **Personalized Recommendations**: Receive song suggestions tailored to your listening habits.
- **User-Friendly Interface**: Navigate through the platform with ease.
- **Playlist Creation**: Create and manage your own playlists.
- **Search Functionality**: Find your favorite songs and artists quickly.

## Modules

- **Backend**: FastAPI-based API server handling requests, user authentication, and data management.
- **Frontend**: React-based user interface for interacting with the platform.
- **Dataset**: Contains data used for training recommendation models.
- **Hybrid-Model**: Implements the recommendation algorithm combining collaborative filtering and content-based filtering.

## Getting Started

### Prerequisites

- **Python 3.8 or later**: Ensure Python is installed on your machine. Download it from [python.org](https://www.python.org/).
- **Node.js**: Ensure Node.js is installed for the frontend. Download it from [nodejs.org](https://nodejs.org/).
- **npm**: Node.js comes with npm (Node Package Manager). Verify its installation by running `npm -v` in your terminal.

---


### Environment Variables

#### Backend
The backend requires a `client.env` file in the `backend` directory to store sensitive information. Create a `client.env` file and add the following variables:

```plaintext
Client_ID=                  # Your OAuth Client ID for integrating with external services like Spotify
Client_Secret=              # The corresponding secret for the above Client ID

MONGO_URI=                  # Connection string for your MongoDB instance
DB_NAME=                    # Name of the database in MongoDB
MONGO_USER_PASS=            # Password for accessing the MongoDB database

SECRET_COOKIE_KEY=          # Key used for signing cookies to maintain secure sessions
ALGORITHM=HS256             # Algorithm used for generating JWT tokens
ACCESS_TOKEN_EXPIRE_MINUTES=120 # Token expiration time in minutes

EMAIL_HOST=smtp.gmail.com   # SMTP host for sending emails (e.g., Gmail's SMTP server)
EMAIL_PORT=587              # SMTP port (e.g., Gmail uses 587 for TLS)
EMAIL_USER=                 # Email address to send notifications from
EMAIL_PASS=                 # Password for the above email account
```

#### Usage of Each Variable

- **`Client_ID` and `Client_Secret`**:
  Used for OAuth authentication with services like Spotify, enabling access to APIs for fetching music metadata and other resources.

- **`MONGO_URI`, `DB_NAME`, and `MONGO_USER_PASS`**:
  These are MongoDB credentials for connecting the backend to your database where user data, playlists, and application data are stored.

- **`SECRET_COOKIE_KEY`**:
  Ensures the security of cookies used in sessions. Protects against tampering and forgery.

- **`ALGORITHM`**:
  Specifies the algorithm for signing JWTs (JSON Web Tokens) used for authentication and authorization.

- **`ACCESS_TOKEN_EXPIRE_MINUTES`**:
  Defines how long an access token remains valid after being issued.

- **`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, and `EMAIL_PASS`**:
  Used for sending email notifications (e.g., password reset emails). These credentials allow the backend to send emails securely using an SMTP server.


#### Frontend
In the **frontend** directory, create a `.env` file and add the following variables to configure the frontend to connect to the backend:

- **NEXT_PUBLIC_SERVER_URL:** URL of the backend server, typically the host and port where the backend is running. Example: `http://127.0.0.1:8000`.
- **NEXT_PUBLIC_WSS_URL:** URL for WebSocket communication. Example: `ws://127.0.0.1:8000/ws`.

**Note:** You must update these variables in the `.env` file based on the host and port the user runs the backend on. The frontend will use these URLs to send requests to the correct endpoints.

Here’s the structure to maintain in the `.env` file:

```bash
NEXT_PUBLIC_SERVER_URL=http://your-backend-url
NEXT_PUBLIC_WSS_URL=ws://your-backend-url/ws
```


### Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/NikantYadav/FreeTunes.git
   cd FreeTunes
   ```

2. **Install Backend Dependencies**:

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Install Frontend Dependencies**:

   ```bash
   cd ../frontend
   npm install
   ```

### Usage

1. **Prepare Backend Directory** (One-Time Setup):

   Before starting the backend server for the first time, create a directory named `hls` in the `backend` folder. This directory is used for temporary storage of segmented media files.

   Run the following command **only once**:

   ```bash
   cd backend
   mkdir hls
   ```
   
2. **Start the Backend Server**:

   After the one-time setup, start the backend server using:

   ```bash
   uvicorn main:app --host 127.0.0.1 --port 7823 --reload
   ```

   The backend server will start, accessible at `http://127.0.0.1:7823`.
   

3. **Start the Frontend Server**:

   Open a new terminal window and navigate to the `frontend` directory:

   ```bash
   cd frontend
   npm run dev
   ```

   The frontend will launch, usually accessible at `http://localhost:3000`.

4. **Access the Application**:

   Open your web browser and navigate to `http://localhost:3000` to start using FreeTunes.


## Project Roadmap

- **Upcoming Features**:
  - Integration with additional music sources.
  - Enhanced user profile management.
  - Mobile responsiveness improvements.
  - Social sharing capabilities.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`.
3. Make your changes and commit them: `git commit -m 'Add new feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Submit a pull request detailing your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Inspiration**: This project draws inspiration from popular music streaming platforms, aiming to provide an open-source alternative with unique features.
- **Contributors**: Special thanks to all contributors who have helped in developing and improving FreeTunes.

---
