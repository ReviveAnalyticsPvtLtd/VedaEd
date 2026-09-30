const mongoose = require("mongoose");
const { Schema } = mongoose;

const VacancySchema = new Schema(
    {
        /**
         * Authoritative tenant ownership. Assigned server-side from the
         * authenticated session (req.user.schoolId) on creation and never
         * accepted from the request body. Immutable so no later update path can
         * move a vacancy to another school.
         */
        schoolId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "School",
            required: true,
            index: true,
            immutable: true,
        },
        academicYear: { type: String, required: true },
        className: { type: String, required: true },
        totalSeats: { type: Number, required: true },
        reservedSeats: { type: Number, default: 0 },
        availableSeats: { type: Number },
        startDate: { type: String },
        endDate: { type: String },
        status: { type: String, enum: ["Open", "Closed"], default: "Open" },
    },
    { timestamps: true }
);

VacancySchema.pre("save", function (next) {
    this.availableSeats = this.totalSeats - this.reservedSeats;
    next();
});

module.exports = mongoose.model("Vacancy", VacancySchema);
