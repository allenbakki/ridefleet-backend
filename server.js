import express from 'express';
import mysql from 'mysql2';
import cors from 'cors'; 
import mainRoute from "./routes/routes.js";

const app = express();

app.use(cors());

app.use(express.json()); 

const PORT = process.env.PORT || 8000;

app.use("/", mainRoute);

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Reshma@1405",
  database: "rideFleet",
});

con.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
    return;
  }
  console.log("Connected to the database.");
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export {con}