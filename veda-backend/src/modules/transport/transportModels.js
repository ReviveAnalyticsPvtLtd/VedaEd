const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    vehicleNumber: { type: String, required: true, unique: true },
    model: { type: String, required: true },
    year: { type: String },
    registration: { type: String },
    chasis: { type: String },
    capacity: { type: String },
    driverName: { type: String },
    licence: { type: String },
    contact: { type: String },
    note: { type: String },
    photo: { type: String },
    status: { type: String, enum: ['Active', 'Under Maintenance', 'Inactive'], default: 'Active' },
    kmLeftForService: { type: Number, default: 1000 }
}, { timestamps: true });

const routeSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true }
}, { timestamps: true });

const pickupPointSchema = new mongoose.Schema({
    name: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    time: { type: String, required: true },
    type: { type: String, enum: ['Morning', 'Afternoon', 'Both'], default: 'Morning' }
}, { timestamps: true });

const vehicleAssignmentSchema = new mongoose.Schema({
    route: { type: String, required: true },
    vehicles: [{ type: String }]
}, { timestamps: true });

const routeStopSchema = new mongoose.Schema({
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute', required: true },
    stop: { type: mongoose.Schema.Types.ObjectId, ref: 'PickupPoint', required: true },
    distance: { type: String },
    fee: { type: String },
    order: { type: Number, default: 0 }
}, { timestamps: true });

const maintenanceSchema = new mongoose.Schema({
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    lastServiceDate: { type: Date },
    nextServiceDue: { type: Date },
    currentKm: { type: Number },
    nextServiceDueKm: { type: Number },
    kmLeft: { type: Number },
    status: { type: String, enum: ['Completed', 'Pending', 'In Progress', 'Under Maintenance'], default: 'Pending' },
    notes: { type: String },
    works: [{
        part: String,
        action: String,
        mechanic: String,
        cost: Number,
        date: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

const documentSchema = new mongoose.Schema({
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    type: { type: String, required: true }, // RC, Insurance, etc.
    fileName: { type: String },
    expiryDate: { type: Date },
    fileUrl: { type: String }
}, { timestamps: true });

const fuelingSchema = new mongoose.Schema({
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    date: { type: Date, default: Date.now },
    litres: { type: Number },
    rate: { type: Number },
    amount: { type: Number },
    invoiceUrl: { type: String },
    invoiceType: { type: String }
}, { timestamps: true });

const expenseSchema = new mongoose.Schema({
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    date: { type: Date, default: Date.now },
    type: { type: String }, // Fuel, Maintenance, etc.
    amount: { type: Number },
    note: { type: String }
}, { timestamps: true });

const transportAllocationSchema = new mongoose.Schema({
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute', required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    conductorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    driverName: { type: String },
    driverPhone: { type: String },
    conductorName: { type: String },
    conductorPhone: { type: String },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

const driverSchema = new mongoose.Schema({
    type: { type: String, enum: ['Driver', 'Cleaner'], default: 'Driver' },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    license: { type: String },
    address: { type: String },
    joinDate: { type: Date },
    photo: { type: String },
    aadhaar: { type: String },
    dl: { type: String },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

const transportStudentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute', required: true },
    pickupPointId: { type: mongoose.Schema.Types.ObjectId, ref: 'PickupPoint', required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    fees: [{
        month: String,
        amount: Number,
        status: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' }
    }]
}, { timestamps: true });

module.exports = {
    Vehicle: mongoose.model('Vehicle', vehicleSchema),
    Route: mongoose.model('TransportRoute', routeSchema),
    PickupPoint: mongoose.model('PickupPoint', pickupPointSchema),
    VehicleAssignment: mongoose.model('VehicleAssignment', vehicleAssignmentSchema),
    RouteStop: mongoose.model('RouteStop', routeStopSchema),
    Maintenance: mongoose.model('Maintenance', maintenanceSchema),
    Document: mongoose.model('TransportDocument', documentSchema),
    Fueling: mongoose.model('Fueling', fuelingSchema),
    Expense: mongoose.model('TransportExpense', expenseSchema),
    Allocation: mongoose.model('TransportAllocation', transportAllocationSchema),
    Driver: mongoose.model('Driver', driverSchema),
    TransportStudent: mongoose.model('TransportStudent', transportStudentSchema)
};
