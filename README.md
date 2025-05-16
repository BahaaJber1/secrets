# Secrets Project

This is a web application that allows users to register, log in (using local authentication or Google OAuth2), submit secrets, and view their own secret. User data is securely stored in a PostgreSQL database.

---

## Features

- **User Registration**: Users can register with their email and password.
- **User Login**: Users can log in using:
  - Local authentication (email and password).
  - Google OAuth2.
- **Submit Secrets**: Users can submit their own secrets.
- **View Secrets**: Users can view their submitted secrets.
- **Persistent Login**: Sessions are used to keep users logged in across requests.
- **Secure Passwords**: Passwords are hashed using bcrypt before being stored in the database.

---

## Technologies Used

- **Backend**: Node.js, Express.js
- **Authentication**: Passport.js (Local Strategy and Google OAuth2)
- **Database**: PostgreSQL
- **Password Hashing**: bcrypt
- **Session Management**: express-session
- **Environment Variables**: dotenv

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/BahaaJber1/secrets-project.git
   cd secrets-project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the PostgreSQL database:
   - Create a database named `secrets`.
   - Create a `users` table with the following schema:
     ```sql
     CREATE TABLE users (
       id SERIAL PRIMARY KEY,
       email VARCHAR(255) UNIQUE NOT NULL,
       password VARCHAR(255),
       secret TEXT
     );
     ```

4. Create a `.env` file in the root directory and add the following:
   ```env
   SESSION_SECRET=your_session_secret
   PG_USER=your_postgres_user
   PG_HOST=localhost
   PG_DATABASE=secrets
   PG_PASSWORD=your_postgres_password
   PG_PORT=5432
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

5. Start the server:
   ```bash
   node index.js
   ```

6. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## Routes

### Public Routes
- `/`: Home page.
- `/login`: Login page.
- `/register`: Registration page.

### Protected Routes
- `/secrets`: View the user's secret (requires login).
- `/submit`: Submit a new secret (requires login).

### OAuth Routes
- `/auth/google`: Redirects to Google for authentication.
- `/auth/google/secrets`: Callback route for Google OAuth.

---

## How It Works

1. **Registration**:
   - Users register with their email and password.
   - Passwords are hashed using bcrypt before being stored in the database.
   - After registration, the user is automatically logged in.

2. **Login**:
   - Users can log in using their email and password (local authentication).
   - Alternatively, users can log in using their Google account (OAuth2).

3. **Secrets**:
   - Logged-in users can view their submitted secrets.
   - Users can submit new secrets, which are saved to the database.

4. **Persistent Login**:
   - Sessions are used to keep users logged in across requests.
   - Passport.js handles session management.

---

## Folder Structure

```
secrets-project/
├── public/                 # Static files (CSS, images, etc.)
├── views/                  # EJS templates
│   ├── home.ejs            # Home page
│   ├── login.ejs           # Login page
│   ├── register.ejs        # Registration page
│   ├── secrets.ejs         # Secrets page
│   ├── submit.ejs          # Submit secret page
├── index.js                # Main server file
├── package.json            # Project metadata and dependencies
├── .env                    # Environment variables
└── README.md               # Project documentation
```

---

## Dependencies

- **express**: Web framework for Node.js.
- **body-parser**: Parses incoming form data.
- **pg**: PostgreSQL client for Node.js.
- **bcrypt**: For hashing passwords securely.
- **passport**: Authentication middleware.
- **passport-local**: Local username/password strategy for Passport.
- **passport-google-oauth2**: Google OAuth2 strategy for Passport.
- **express-session**: Session management middleware.
- **dotenv**: For managing environment variables.

---

## Security Notes

- **Passwords**: Passwords are hashed using bcrypt before being stored in the database.
- **Sessions**: Sessions are signed using a secret stored in the `.env` file.
- **Environment Variables**: Sensitive information (e.g., database credentials, session secret, Google OAuth credentials) is stored in the `.env` file and not hardcoded.

---

## Future Improvements

- Add support for multiple secrets per user.
- Implement email verification during registration.
- Add password reset functionality.
- Improve UI/UX with a modern frontend framework.

---


## Author

Developed by [BahaaJber1](https://github.com/BahaaJber1).  
Feel free to reach out for questions or suggestions!
