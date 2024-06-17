"use strict";

/**
 * Example of a database connection if using SQLite3.
 */

import { Database } from "sqlite3";

const sqlite = require("sqlite3");

// The environment variable is used to determine which database to use.
// If the environment variable is not set, the development database is used.
// A separate database needs to be used for testing to avoid corrupting the development database and ensuring a clean state for each test.

//The environment variable is set in the package.json file in the test script.
let env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : "development";

// The database file path is determined based on the environment variable.
const dbFilePath = env === "test" ? "./src/db/testdb.db" : "./src/db/db.db";

// The database is created and the foreign keys are enabled.
const db: Database = new sqlite.Database(dbFilePath, (err: Error | null) => {
  if (err) throw err;
  db.run("PRAGMA foreign_keys = ON");

  // Create the "products" table
  db.run(`CREATE TABLE IF NOT EXISTS products ( "model"  TEXT NOT NULL UNIQUE,
    "category"  TEXT NOT NULL,
    "quantity"  INTEGER NOT NULL,
    "details"  TEXT,
    "sellingPrice"  NUMERIC NOT NULL,
    "arrivalDate"  TEXT NOT NULL,
    PRIMARY KEY("model")
  )`);
  // Create the "carts" table
  db.run(`CREATE TABLE IF NOT EXISTS carts ( "cartId"  TEXT NOT NULL,
  "customer"  TEXT NOT NULL,
  "model"  TEXT NOT NULL,
  "paid"  TEXT,
  "paymentDate"  TEXT,
  "cost"  NUMERIC,
  "amount"  INTEGER,
  PRIMARY KEY("cartId","customer","model"),
  FOREIGN KEY("customer") REFERENCES "users"("username") ON DELETE CASCADE,
  FOREIGN KEY("model") REFERENCES "products"("model")
    )`);
  // Create the "reviews" table
  db.run(`CREATE TABLE IF NOT EXISTS reviews ( "model"  TEXT NOT NULL,
    "user"  TEXT NOT NULL,
    "score"  INTEGER NOT NULL,
    "date"  TEXT NOT NULL,
    "comment"  TEXT NOT NULL,
    PRIMARY KEY ("model","user")
    FOREIGN KEY("user") REFERENCES "users"("username") ON DELETE CASCADE,
    FOREIGN KEY("model") REFERENCES "products"("model") ON DELETE CASCADE
  )`);
});

export default db;
