const { Vehicle, Route, PickupPoint, VehicleAssignment, RouteStop, Maintenance, Document, Fueling, Expense, Allocation, Driver, TransportStudent } = require('./transportModels');
const Student = require('../student/studentModels');
const Class = require('../class/classSchema');
const Section = require('../section/sectionSchema');

// Drivers
exports.getDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find();
        res.status(200).json(drivers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createDriver = async (req, res) => {
    try {
        const driver = new Driver(req.body);
        await driver.save();
        res.status(201).json(driver);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateDriver = async (req, res) => {
    try {
        const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(driver);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteDriver = async (req, res) => {
    try {
        await Driver.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Driver deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.uploadDriverDocuments = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({ url: fileUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Route Stops (Mapping Routes to Pickup Points)
exports.getRouteStops = async (req, res) => {
    try {
        const stops = await RouteStop.find()
            .populate('route')
            .populate('stop');
        res.status(200).json(stops);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createRouteStop = async (req, res) => {
    try {
        const stop = new RouteStop(req.body);
        await stop.save();
        res.status(201).json(stop);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteRouteStop = async (req, res) => {
    try {
        await RouteStop.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Route stop removed successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Vehicles
exports.getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find();
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createVehicle = async (req, res) => {
    try {
        const vehicle = new Vehicle(req.body);
        await vehicle.save();
        res.status(201).json(vehicle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(vehicle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteVehicle = async (req, res) => {
    try {
        await Vehicle.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Vehicle deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Routes
exports.getRoutes = async (req, res) => {
    try {
        const routes = await Route.find();
        res.status(200).json(routes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createRoute = async (req, res) => {
    try {
        const route = new Route(req.body);
        await route.save();
        res.status(201).json(route);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateRoute = async (req, res) => {
    try {
        const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(route);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteRoute = async (req, res) => {
    try {
        await Route.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Route deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Pickup Points
exports.getPickupPoints = async (req, res) => {
    try {
        const points = await PickupPoint.find();
        res.status(200).json(points);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createPickupPoint = async (req, res) => {
    try {
        const point = new PickupPoint(req.body);
        await point.save();
        res.status(201).json(point);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updatePickupPoint = async (req, res) => {
    try {
        const point = await PickupPoint.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(point);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deletePickupPoint = async (req, res) => {
    try {
        await PickupPoint.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Pickup point deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Vehicle Assignments
exports.getAssignments = async (req, res) => {
    try {
        const assignments = await VehicleAssignment.find();
        res.status(200).json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createAssignment = async (req, res) => {
    try {
        const assignment = new VehicleAssignment(req.body);
        await assignment.save();
        res.status(201).json(assignment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateAssignment = async (req, res) => {
    try {
        const assignment = await VehicleAssignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(assignment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteAssignment = async (req, res) => {
    try {
        await VehicleAssignment.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Assignment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Fleet Maintenance
exports.getMaintenance = async (req, res) => {
    try {
        const vehicles = await Vehicle.find();
        const maintenanceRecords = await Maintenance.find();

        const result = vehicles.map(v => {
            const m = maintenanceRecords.find(record => record.vehicleId.toString() === v._id.toString());
            return {
                _id: m ? m._id : v._id,
                vehicleId: v,
                lastServiceDate: m ? m.lastServiceDate : null,
                nextServiceDue: m ? m.nextServiceDue : null,
                kmLeft: v.kmLeftForService || (m ? m.kmLeft : 1000),
                status: m ? m.status : v.status,
                notes: m ? m.notes : ""
            };
        });

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createMaintenance = async (req, res) => {
    try {
        const maintenance = new Maintenance(req.body);
        await maintenance.save();
        res.status(201).json(maintenance);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getMaintenanceById = async (req, res) => {
    try {
        const maintenance = await Maintenance.findById(req.params.id).populate('vehicleId');
        res.status(200).json(maintenance);
    } catch (error) {
        res.status(404).json({ message: "Maintenance record not found" });
    }
};

exports.updateMaintenance = async (req, res) => {
    try {
        const maintenance = await Maintenance.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(maintenance);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Documents
exports.getDocuments = async (req, res) => {
    try {
        const docs = await Document.find().populate('vehicleId');
        res.status(200).json(docs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createDocument = async (req, res) => {
    try {
        const doc = new Document(req.body);
        await doc.save();
        res.status(201).json(doc);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        await Document.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Document deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Fleet Dashboard Stats
exports.getFleetStats = async (req, res) => {
    try {
        const totalVehicles = await Vehicle.countDocuments();
        const activeVehicles = await Vehicle.countDocuments({ status: 'Active' });
        const inMaintenance = await Vehicle.countDocuments({ status: 'Under Maintenance' });
        const driversAssigned = await Vehicle.countDocuments({ driverName: { $exists: true, $ne: "" } });
        const pendingDocs = await Document.countDocuments({ expiryDate: { $lt: new Date() } });

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const fuelResults = await Fueling.aggregate([
            { $match: { date: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const expenseResults = await Expense.aggregate([
            { $match: { date: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const monthlyFuelCost = fuelResults.length > 0 ? fuelResults[0].total : 0;
        const monthlyOtherExpenses = expenseResults.length > 0 ? expenseResults[0].total : 0;

        res.status(200).json({
            totalVehicles,
            activeVehicles,
            inMaintenance,
            driversAssigned,
            monthlyFuelCost: monthlyFuelCost + monthlyOtherExpenses,
            pendingDocuments: pendingDocs
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Fueling
exports.getFueling = async (req, res) => {
    try {
        const query = req.query.vehicleId ? { vehicleId: req.query.vehicleId } : {};
        const entries = await Fueling.find(query).populate('vehicleId');
        res.status(200).json(entries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createFueling = async (req, res) => {
    try {
        const entry = new Fueling(req.body);
        await entry.save();
        res.status(201).json(entry);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteFueling = async (req, res) => {
    try {
        await Fueling.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Fueling log deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Expenses
exports.getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find().populate('vehicleId');
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createExpense = async (req, res) => {
    try {
        const expense = new Expense(req.body);
        await expense.save();
        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Expense deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Allocation
exports.getAllocations = async (req, res) => {
    try {
        const allocations = await Allocation.find()
            .populate('routeId')
            .populate('vehicleId')
            .populate('driverId')
            .populate('conductorId');
        res.status(200).json(allocations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createAllocation = async (req, res) => {
    try {
        const allocation = new Allocation(req.body);
        await allocation.save();
        res.status(201).json(allocation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateAllocation = async (req, res) => {
    try {
        const allocation = await Allocation.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(allocation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteAllocation = async (req, res) => {
    try {
        await Allocation.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Allocation deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Student Transport
exports.getStudentTransportRoute = async (req, res) => {
    try {
        const { studentId } = req.params;
        const assignment = await TransportStudent.findOne({ studentId, status: 'Active' })
            .populate('routeId')
            .populate('pickupPointId');

        if (!assignment) {
            return res.status(404).json({ message: "No transport route assigned" });
        }

        const allocation = await Allocation.findOne({ routeId: assignment.routeId })
            .populate('vehicleId')
            .populate('driverId');

        const routeStops = await RouteStop.find({ route: assignment.routeId })
            .populate('stop')
            .sort('order');

        const pickupPoints = routeStops.map(rs => ({
            name: rs.stop.name,
            latitude: rs.stop.latitude,
            longitude: rs.stop.longitude,
            time: rs.stop.time,
            isStudentPickup: rs.stop._id.toString() === assignment.pickupPointId._id.toString()
        }));

        res.status(200).json({
            routeName: assignment.routeId.title,
            vehicleNumber: allocation?.vehicleId?.vehicleNumber || "Not Assigned",
            driverName: allocation?.driverName || allocation?.driverId?.name || "Not Assigned",
            driverContact: allocation?.driverPhone || allocation?.driverId?.phone || "N/A",
            pickupPoints
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getChildrenTransportRoutes = async (req, res) => {
    try {
        const { parentId } = req.params;
        const students = await Student.find({ parent: parentId });

        const results = [];
        for (const student of students) {
            const assignment = await TransportStudent.findOne({ studentId: student._id, status: 'Active' })
                .populate('routeId')
                .populate('pickupPointId');

            if (assignment) {
                const allocation = await Allocation.findOne({ routeId: assignment.routeId })
                    .populate('vehicleId')
                    .populate('driverId');

                results.push({
                    childName: student.personalInfo.name,
                    routeName: assignment.routeId.title,
                    vehicleNumber: allocation?.vehicleId?.vehicleNumber || "Not Assigned",
                    driverName: allocation?.driverName || allocation?.driverId?.name || "Not Assigned",
                    driverContact: allocation?.driverPhone || allocation?.driverId?.phone || "N/A",
                    pickupPoint: assignment.pickupPointId.name,
                    time: assignment.pickupPointId.time
                });
            }
        }
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.assignStudentTransport = async (req, res) => {
    try {
        const { studentId, routeId, pickupPointId } = req.body;
        let assignment = await TransportStudent.findOne({ studentId });

        if (assignment) {
            assignment.routeId = routeId;
            assignment.pickupPointId = pickupPointId;
            assignment.status = 'Active';
        } else {
            assignment = new TransportStudent({ studentId, routeId, pickupPointId });
        }

        await assignment.save();
        res.status(201).json(assignment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllTransportStudents = async (req, res) => {
    try {
        const { klass, section } = req.query;
        const transportQuery = {};

        if (klass) {
            const classDoc = await Class.findOne({ name: klass });
            if (!classDoc) return res.status(200).json([]);

            const studentFilter = { 'personalInfo.class': classDoc._id };
            if (section) {
                const sectionDoc = await Section.findOne({ name: section });
                if (!sectionDoc) return res.status(200).json([]);
                studentFilter['personalInfo.section'] = sectionDoc._id;
            }

            const classStudents = await Student.find(studentFilter).select('_id');
            const studentIds = classStudents.map(s => s._id);
            if (!studentIds.length) return res.status(200).json([]);
            transportQuery.studentId = { $in: studentIds };
        }

        const transportStudents = await TransportStudent.find(transportQuery)
            .populate({ path: 'studentId', populate: { path: 'parent', select: 'fatherName motherName' } })
            .populate('routeId')
            .populate('pickupPointId');

        const results = [];
        for (const ts of transportStudents) {
            const student = ts.studentId;
            if (!student) continue;

            const allocation = await Allocation.findOne({ routeId: ts.routeId })
                .populate('vehicleId')
                .populate('driverId');

            results.push({
                _id: ts._id,
                studentId: student._id,
                admissionNo: student.personalInfo?.stdId || 'N/A',
                name: student.personalInfo?.name || 'N/A',
                father: student.parent?.fatherName || '-',
                route: ts.routeId?.title || '-',
                vehicle: allocation?.vehicleId?.vehicleNumber || 'Not Assigned',
                pickup: ts.pickupPointId?.name || '-',
                fees: ts.fees || []
            });
        }

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.payStudentTransportFees = async (req, res) => {
    try {
        const { studentId, month, amount } = req.body;
        const assignment = await TransportStudent.findOne({ studentId });

        if (!assignment) {
            return res.status(404).json({ message: "No transport assignment found" });
        }

        assignment.fees.push({ month, amount, status: 'Paid' });
        await assignment.save();
        res.status(200).json(assignment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
