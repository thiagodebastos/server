const pg = require("pg");
// configure connection to postgres
// postgress will be used to store user data (username/password)
const dbConfig = {
  user: "postgres",
  password: "postgres",
  database: "auth_tutorial",
  host: "127.0.0.1",
  port: "5432",
  // max: config.db.max,
  idleTimeoutMillis: 10000
};

const pool = new pg.Pool(dbConfig);
pool.on("error", function(err) {
  console.error("idle client error", err.message, err.stack);
});

/**
    We want to provide configuration object to initialize pool. Rather than
    providing constant values, we pass config, which takes proper data based on
    running environment (for production, we’re using process env). Next, we expose
    the interface to use in other modules, which need access to Postgres.
*/
module.exports = {
  query: (text, params, callback) => {
    return pool.query(text, params, callback);
  }
};
