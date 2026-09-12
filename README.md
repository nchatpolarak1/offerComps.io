# Job Offer Comparison Tool

Nathan Chatpolarak - Web Development final project

A web application for comparing competing job offers. A job seeker saves the
offers they have received, sets weight sliders for what matters to them (pay,
commute, hours, flexibility), and the application scores and ranks the offers
side by side after adjusting for taxes and cost of living.

## Technologies

| Layer | Technology |
| --- | --- |
| Backend | Node.js with Express |
| Frontend | React (built with Vite) |
| Relational database | MySQL |
| Cache | Redis |
| NoSQL database | MongoDB |
| Additional tool | Chart.js |

### What each database is used for

- **MySQL** holds the structured, relational data: users, offers, companies,
  cities, states, tax brackets, vesting tranches, comparisons, and the
  comparison-to-offer junction table.
- **Redis** holds the login sessions (`session:<token>`, 30 minute sliding
  expiry), cached comparison scores, cached city and tax bracket lookups, and
  the failed login counter that locks an account after 5 bad passwords.
- **MongoDB** holds the data that does not fit fixed columns: each offer's perk
  list (`offer_perks`).

## Requirements

- Node.js 18 or newer
- MySQL 8 (or MariaDB 10.6+)
- Redis
- MongoDB 7 or newer, with `mongosh`

## Setup

### 1. Create the database and its user

Log in to MySQL as an administrator and run:

```sql
CREATE USER 'joboffers'@'localhost' IDENTIFIED BY 'your_password_here';
CREATE DATABASE job_offers CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
GRANT ALL PRIVILEGES ON job_offers.* TO 'joboffers'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Load the schema and reference data

```sh
mysql -h 127.0.0.1 -u joboffers -p job_offers < db/mysql/schema.sql
mysql -h 127.0.0.1 -u joboffers -p job_offers < db/mysql/seed.sql
```

`schema.sql` creates the nine tables. `seed.sql` fills in the states, the list
of cities, and the federal and state tax brackets.

### 3. Set up the MongoDB collections

```sh
mongosh job_offers db/mongo/init.js
```

### 4. Configure the server

```sh
cd server
cp .env.example .env
```

Edit `.env` and set `MYSQL_PASSWORD` to the password chosen in step 1.

### 5. Install dependencies

```sh
cd server && npm install
cd ../client && npm install
```

## Running the application

Start the API server in one terminal:

```sh
cd server
npm run dev
```

Start the React development server in another:

```sh
cd client
npm run dev
```

The application is then available at <http://localhost:5173>. The Vite dev
server forwards any request beginning with `/api` to the Express server on
port 3000.

## Project layout

```
db/
  mysql/schema.sql   table definitions
  mysql/seed.sql     states, cities, and tax brackets
  mongo/init.js      MongoDB collections and indexes
  dumps/             exported dumps of all three databases
server/
  src/config/        environment configuration
  src/db/            MySQL, Redis, and MongoDB connections
  src/repositories/  database queries
  src/services/      application logic
  src/controllers/   request handlers
  src/middleware/    authentication, rate limiting, error handling
  src/routes/        route definitions
client/
  src/context/       React context for the logged in user
  src/services/      wrapper around fetch for calling the API
  src/pages/         one component per page
```
