import { con } from "./server.js";

export async function getRideHistory(req, res) {
  const { vehicleNo } = req.query;

  if (!vehicleNo) {
    res.status(400).send("Missing vehicleNo parameter");
    return;
  }

  con.query(
    "SELECT * FROM drivingHistory WHERE VehicleNumber = ?",
    [vehicleNo],
    (err, drivingResults) => {
      if (err) {
        console.error("Error fetching driving history:", err.message);
        res.status(500).send("Database query error");
        return;
      }

      if (drivingResults.length === 0) {
        res.status(404).send("No driving history found for the given vehicle number");
        return;
      }

      const paymentIDs = drivingResults.map((row) => row.PaymentID);

      con.query(
        "SELECT * FROM paymenthistory WHERE PaymentID IN (?)",
        [paymentIDs],
        (err, paymentResults) => {
          if (err) {
            console.error("Error fetching payment history:", err.message);
            res.status(500).send("Database query error");
            return;
          }

          const combinedResults = drivingResults.map((drive) => {
            const payment = paymentResults.find(
              (pay) => pay.PaymentID === drive.PaymentID
            );
            const amount=payment.TotalRideCost-(payment.PlatformFee-payment.Tax)
            return { ...drive, paymentDetails: amount || null };
          });

          console.log("Combined Results:", combinedResults);
          res.json(combinedResults);
        }
      );
    }
  );
}


export async function getMaintenanceHistory(req, res) {
    const { vehicleNo } = req.query;
  
    if (!vehicleNo) {
      res.status(400).send("Missing vehicleNo parameter");
      return;
    }
  
    con.query(
      "SELECT * FROM maintenanceHistory WHERE VehicleNumber = ?",
      [vehicleNo],
      (err, maintenanceResults) => {
        if (err) {
          console.error("Error fetching maintenance history:", err.message);
          res.status(500).send("Database query error");
          return;
        }
  
        if (maintenanceResults.length === 0) {
          res.status(404).send("No maintenance history found for the given vehicle number");
          return;
        }
  
        const serviceNumbers = maintenanceResults.map((row) => row.ServiceNumber);
  
        con.query(
          "SELECT * FROM maintenancepaymentrecord WHERE ServiceNumber IN (?)",
          [serviceNumbers],
          (err, paymentResults) => {
            if (err) {
              console.error("Error fetching maintenance payment records:", err.message);
              res.status(500).send("Database query error");
              return;
            }
  
            const combinedResults = maintenanceResults.map((maintenance) => {
              const payment = paymentResults.find(
                (pay) => pay.ServiceNumber === maintenance.ServiceNumber
              );
              console.log(payment)
              
              return { ...maintenance, paymentDetails: payment.Cost };
            });
  
            console.log("Combined Results:", combinedResults);
            res.json(combinedResults);
          }
        );
      }
    );
  }

  export async function getVehicleDetails(req,res) {
    const { vehicleNo } = req.query;
    if (!vehicleNo) {
        res.status(400).send("Missing vehicleNo parameter");
        return;
      }
      con.query(
        "select * from vehicle where vehicleNumber = ?",
        [vehicleNo],
        (err, vehicleDetails) => {
          if (err) {
            console.error("Error fetching maintenance history:", err.message);
            res.status(500).send("Database query error");
            return;
          }
    
          if (vehicleDetails.length === 0) {
            res.status(404).send("No maintenance history found for the given vehicle number");
            return;
          }
    
          res.json(vehicleDetails);

        }
      );
    
  }
  
  export async function getVehicleNames(req,res){
   
      con.query(
        "select vehicleNumber,vehicleModel,vehicleMake,odometer from vehicle",
        (err, vehicleDetails) => {
          if (err) {
            console.error("Error fetching maintenance history:", err.message);
            res.status(500).send("Database query error");
            return;
          }
    
          if (vehicleDetails.length === 0) {
            res.status(404).send("No maintenance history found for the given vehicle number");
            return;
          }
    
          res.json(vehicleDetails);

        }
      );
  }

  export async function getTotalSpend(req, res) {
    const { vehicleNo } = req.query;
  
    if (!vehicleNo) {
      res.status(400).send("Missing vehicleNo parameter");
      return;
    }
  
    con.query(
      "select sum(cost) as totalSpent from maintenancepaymentRecord where vehiclenumber = ?",
      [vehicleNo],
      (err, result) => {
        if (err) {
          console.error("Error fetching maintenance history:", err.message);
          res.status(500).send("Database query error");
          return;
        }
  
        // If no records found, return 0 as total spent
        const totalSpent = result[0]['totalSpent'] || 0;
        res.json({ totalSpent });
      }
    );
  }
  
  export async function addMaintenance(req, res) {
    const { vehicleNo, ServiceNumber, Date, WorkDone, Notes, FutureRecommendations, paymentDetails } = req.body;
    const formattedDate = Date.split('T')[0];  // '2024-11-29'

  
    try {
      const query1 = `
        INSERT INTO maintenancepaymentrecord (vehicleNumber, ServiceNumber, Cost)
        VALUES (?, ?, ?)
      `;
      await new Promise((resolve, reject) => {
        con.query(query1, [vehicleNo, Number(ServiceNumber), paymentDetails], (err, result) => {
          if (err) {
            console.log("Error inserting into maintenance:", err);
            return reject("Error inserting into maintenance");
          }
          resolve(result);
        });
      });
  
      const query2 = `
        INSERT INTO maintenancehistory (vehicleNumber, ServiceNumber, Date, WorkDone, Notes, FutureRecommendations)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await new Promise((resolve, reject) => {
        con.query(query2, [vehicleNo, Number(ServiceNumber), formattedDate, WorkDone, Notes, FutureRecommendations], (err, result) => {
          if (err) {
            console.error("Error inserting into maintenancehistory:", err);
            return reject("Error inserting into maintenancehistory");
          }
          resolve(result);
        });
      });
  
      res.status(200).json({
        vehicleNo,
        ServiceNumber,
        Date,
        WorkDone,
        Notes,
        FutureRecommendations,
        paymentDetails,
      });
    } catch (err) {
      console.error("Error adding maintenance:", err);
      res.status(500).send(err); 
    }
  }
  

  export async function deleteMaintenance(req, res) {
    const { vehicleNo, ServiceNumber } = req.body;     
    try {
      const query1 = `
        DELETE FROM maintenancepaymentrecord WHERE ServiceNumber = ? AND VehicleNumber = ?
      `;
      await new Promise((resolve, reject) => {
        con.query(query1, [Number(ServiceNumber), vehicleNo], (err, result) => {
          if (err) {
            console.log("Error deleting from maintenancepaymentrecord:", err);
            return reject("Error deleting from maintenancepaymentrecord");
          }
          resolve(result);
        });
      });
  
      const query2 = `
        DELETE FROM maintenancehistory WHERE ServiceNumber = ? AND VehicleNumber = ?
      `;
      await new Promise((resolve, reject) => {
        con.query(query2, [Number(ServiceNumber), vehicleNo], (err, result) => {
          if (err) {
            console.log("Error deleting from maintenancehistory:", err);
            return reject("Error deleting from maintenancehistory");
          }
          resolve(result);
        });
      });
  
      res.status(200).json({
        message: `Maintenance record with ServiceNumber ${ServiceNumber} for vehicle ${vehicleNo} deleted successfully.`,
      });
    } catch (err) {
      console.error("Error deleting maintenance:", err);
      res.status(500).send("Error deleting maintenance record");
    }
  }
  