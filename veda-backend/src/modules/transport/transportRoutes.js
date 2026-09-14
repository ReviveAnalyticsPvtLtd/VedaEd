const express = require('express');
const router = express.Router();
const transportController = require('./transportControllers');
const imageUpload = require('../../middleware/imageUpload');

// Drivers
router.get('/drivers', transportController.getDrivers);
router.post('/drivers', transportController.createDriver);
router.put('/drivers/:id', transportController.updateDriver);
router.delete('/drivers/:id', transportController.deleteDriver);
router.post('/drivers/upload', imageUpload.single('file'), transportController.uploadDriverDocuments);


// Vehicles
router.get('/vehicles', transportController.getVehicles);
router.post('/vehicles', transportController.createVehicle);
router.put('/vehicles/:id', transportController.updateVehicle);
router.delete('/vehicles/:id', transportController.deleteVehicle);

// Routes
router.get('/routes', transportController.getRoutes);
router.post('/routes', transportController.createRoute);
router.put('/routes/:id', transportController.updateRoute);
router.delete('/routes/:id', transportController.deleteRoute);

// Pickup Points
router.get('/pickup-points', transportController.getPickupPoints);
router.post('/pickup-points', transportController.createPickupPoint);
router.put('/pickup-points/:id', transportController.updatePickupPoint);
router.delete('/pickup-points/:id', transportController.deletePickupPoint);

// Assignments
router.get('/assignments', transportController.getAssignments);
router.post('/assignments', transportController.createAssignment);
router.put('/assignments/:id', transportController.updateAssignment);
router.delete('/assignments/:id', transportController.deleteAssignment);

// Route Stops
router.get('/route-stops', transportController.getRouteStops);
router.post('/route-stops', transportController.createRouteStop);
router.delete('/route-stops/:id', transportController.deleteRouteStop);

// Fleet Management (Dashboard, Maintenance, Documents)
router.get('/maintenance', transportController.getMaintenance);
router.post('/maintenance', transportController.createMaintenance);
router.get('/maintenance/:id', transportController.getMaintenanceById);
router.put('/maintenance/:id', transportController.updateMaintenance);

router.get('/documents', transportController.getDocuments);
router.post('/documents', transportController.createDocument);
router.delete('/documents/:id', transportController.deleteDocument);

router.get('/fueling', transportController.getFueling);
router.post('/fueling', transportController.createFueling);
router.delete('/fueling/:id', transportController.deleteFueling);

router.get('/expenses', transportController.getExpenses);
router.post('/expenses', transportController.createExpense);
router.put('/expenses/:id', transportController.updateExpense);
router.delete('/expenses/:id', transportController.deleteExpense);

router.get('/allocations', transportController.getAllocations);
router.post('/allocations', transportController.createAllocation);
router.put('/allocations/:id', transportController.updateAllocation);
router.delete('/allocations/:id', transportController.deleteAllocation);

router.get('/fleet-stats', transportController.getFleetStats);

// Student Transport (allocation + fees)
router.get('/student-transports', transportController.getAllTransportStudents);
router.post('/student-transports/pay', transportController.payStudentTransportFees);

module.exports = router;
