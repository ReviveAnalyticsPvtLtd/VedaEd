const mongoose = require('mongoose');

/**
 * CalendarEvent is school-owned. `schoolId` is the authoritative tenant and is
 * taken only from the authenticated user, never from the request payload.
 *
 * It was previously absent from this schema even though the collection already
 * carried it on some documents, and two legacy events have no provable owner:
 * their `createdBy` is the role label "Admin" rather than a user reference and
 * their `classes`/`sections` hold legacy name strings ("1", "A") that match no
 * Class or Section document. Those two are quarantined (invisible to every
 * school) rather than guessed at. See the migration report for the exact list.
 */
const calendarEventSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
        immutable: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String
    },
    endTime: {
        type: String
    },
    type: {
        type: String, // 'Assignment', 'Exam', 'Meeting', 'Holiday'
        required: true
    },
    source: {
        type: String, // 'Manual', 'Auto'
        default: 'Manual'
    },
    category: {
        type: String, // 'Primary', 'Secondary', 'Higher Secondary'
    },
    classes: [{
        type: String
    }],
    sections: [{
        type: String
    }],
    venue: {
        type: String,
        trim: true
    },
    status: {
        type: String, // 'Scheduled', 'Completed'
        default: 'Scheduled'
    },
    priority: {
        type: String, // 'Low', 'Normal', 'High'
        default: 'Normal'
    },
    reminder: {
        type: String,
        default: '1 day before'
    },
    visibility: [{
        type: String // 'Admin', 'Teacher', 'Student', 'Parent', 'Management'
    }],
    createdBy: {
        type: String,
        default: 'Admin'
    }
}, { timestamps: true });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
