const CalendarEvent = require('./calendarModel');
const mongoose = require('mongoose');
const { stripClientSuppliedSchoolId } = require('../../middleware/requireSchoolContext');

/**
 * CalendarEvent is school-owned. Every handler below reads the tenant from
 * req.user.schoolId, which authMiddleware resolved from the authenticated User
 * document, and never from the request payload. stripClientSuppliedSchoolId is
 * additionally applied so a caller cannot assert a school in body or query.
 */
const requireSchool = (req, res) => {
  const schoolId = req.user?.schoolId;
  if (!schoolId || !mongoose.isValidObjectId(String(schoolId))) {
    res.status(403).json({
      success: false,
      message: 'Your account is not linked to a school.'
    });
    return null;
  }
  return String(schoolId);
};

// Create a new event
exports.createEvent = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        stripClientSuppliedSchoolId(req);
        const eventData = { ...req.body };
        // Server-derived tenant. Never accept it from the client.
        eventData.schoolId = schoolId;
        // Ensure backward compatibility with old schema if it's still being used
        if (eventData.type && !eventData.eventType) {
            eventData.eventType = eventData.type;
        }
        
        const newEvent = new CalendarEvent(eventData);
        const savedEvent = await newEvent.save();
        res.status(201).json({ success: true, data: savedEvent });
    } catch (error) {
        console.error("Error creating calendar event:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all events
exports.getEvents = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const { start, end } = req.query;
        const query = { schoolId };

        if (start && end) {
            query.$or = [
                { startDate: { $gte: new Date(start), $lte: new Date(end) } },
                { endDate: { $gte: new Date(start), $lte: new Date(end) } },
                {
                    $and: [
                        { startDate: { $lte: new Date(start) } },
                        { endDate: { $gte: new Date(end) } }
                    ]
                }
            ];
        }

        const events = await CalendarEvent.find(query).sort({ startDate: 1 });
        
        // Ensure 'type' field is present for frontend
        const mappedEvents = events.map(e => {
            const obj = e.toObject();
            if (!obj.type && obj.eventType) obj.type = obj.eventType;
            if (!obj.type) obj.type = 'Other';
            return obj;
        });

        res.status(200).json({ success: true, data: mappedEvents });
    } catch (error) {
        console.error("Error fetching calendar events:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update an event
exports.updateEvent = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        stripClientSuppliedSchoolId(req);
        const updateData = { ...req.body };
        // The tenant is immutable: an update may never move an event between
        // schools, and may never change the one it already belongs to.
        delete updateData.schoolId;
        if (updateData.type && !updateData.eventType) {
            updateData.eventType = updateData.type;
        }

        // findOneAndUpdate, NOT findByIdAndUpdate: the latter takes a bare id
        // and silently discards every other key in the filter, which would drop
        // the schoolId predicate and let one school edit another's event.
        const updatedEvent = await CalendarEvent.findOneAndUpdate(
            { _id: req.params.id, schoolId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedEvent) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        res.status(200).json({ success: true, data: updatedEvent });
    } catch (error) {
        console.error("Error updating calendar event:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        // findOneAndDelete, NOT findByIdAndDelete: see the note in updateEvent.
        const deletedEvent = await CalendarEvent.findOneAndDelete({ _id: req.params.id, schoolId });

        if (!deletedEvent) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        res.status(200).json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting calendar event:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
