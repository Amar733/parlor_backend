const Appointment = require('../models/Appointment');
const ManagedUser = require('../models/ManagedUser');
const Service = require('../models/Service');
const Summary = require('../models/Summary');
const LogService = require('../services/logService');
const { generateDailySummary } = require('../ai/flows/generate-summary-flow');
const { improveText } = require('../ai/flows/improve-text-flow');

// Helper function to check permissions
const hasPermission = (user, permission) => {
    if (user.role === 'admin') return true;
    return user.permissions && user.permissions.includes(permission);
};

exports.generateSummary = async (req, res) => {
    try {
        const requestingUser = req.user;

        if (!requestingUser) {
            return res.status(401).json({
                success: false,
                message: 'Authentication failed'
            });
        }

        const { date: targetDateStr } = req.body;

        if (!targetDateStr) {
            return res.status(400).json({
                success: false,
                message: 'Date is a required field'
            });
        }

        // Get all necessary data
        const allAppointments = await Appointment.find();
        const allUsers = await ManagedUser.find();
        const allServices = await Service.find();

        const serviceIdToNameMap = new Map(allServices.map(s => [s._id.toString(), s.name]));
        const allDoctors = allUsers.filter(u => u.role === 'doctor');

        let usersToProcess = [];

        if (requestingUser.role === 'admin') {
            usersToProcess = [...allDoctors, { _id: 'clinic-wide', name: 'Clinic-Wide', role: 'admin' }];
        } else if (requestingUser.role === 'doctor') {
            usersToProcess = [requestingUser];
        } else {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to generate summaries"
            });
        }

        const results = [];

        for (const targetUser of usersToProcess) {
            try {
                const isClinicWideSummary = targetUser._id === 'clinic-wide';
                const logAction = 'GENERATE_SUMMARY';

                const appointmentsForAnalysis = allAppointments.filter(app => {
                    const isSameDay = app.date === targetDateStr;
                    if (!isSameDay) return false;
                    if (!isClinicWideSummary && app.doctorId.toString() !== targetUser._id.toString()) return false;
                    return true;
                });

                const totalAppointments = appointmentsForAnalysis.length;
                const confirmed = appointmentsForAnalysis.filter(a => a.status === 'Confirmed').length;
                const pending = appointmentsForAnalysis.filter(a => a.status === 'Pending').length;
                const cancelled = appointmentsForAnalysis.filter(a => a.status === 'Cancelled').length;

                const todaysPatientIds = new Set(appointmentsForAnalysis.map(a => a.patientId.toString()));

                let newPatientsCount = 0;

                todaysPatientIds.forEach(patientId => {
                    const hadPreviousAppointment = allAppointments.some(app =>
                        app.patientId.toString() === patientId && new Date(app.date) < new Date(targetDateStr)
                    );
                    if (!hadPreviousAppointment) {
                        newPatientsCount++;
                    }
                });

                const returningPatientsCount = todaysPatientIds.size - newPatientsCount;

                const topServices = Object.entries(appointmentsForAnalysis.reduce((acc, app) => {
                    const serviceName = serviceIdToNameMap.get(app.serviceId.toString()) || 'Unknown Service';
                    acc[serviceName] = (acc[serviceName] || 0) + 1;
                    return acc;
                }, {}))
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([name, count]) => ({ name, count }));

                let doctorLoad = undefined;
                if (isClinicWideSummary && appointmentsForAnalysis.length > 0) {
                    const doctorCounts = appointmentsForAnalysis.reduce((acc, app) => {
                        const doctor = allDoctors.find(d => d._id.toString() === app.doctorId.toString());
                        if (doctor) {
                            acc[doctor.name] = (acc[doctor.name] || 0) + 1;
                        }
                        return acc;
                    }, {});
                    doctorLoad = Object.entries(doctorCounts)
                        .sort(([, a], [, b]) => b - a)
                        .map(([name, count]) => ({ name, count }));
                }

                const flowInput = {
                    date: targetDateStr,
                    doctorName: isClinicWideSummary ? undefined : targetUser.name,
                    totalAppointments,
                    confirmed,
                    pending,
                    cancelled,
                    newPatients: newPatientsCount,
                    returningPatients: returningPatientsCount,
                    topServices,
                    doctorLoad,
                };

                const aiResponse = await generateDailySummary(flowInput);

                if (!aiResponse) {
                    throw new Error(`AI generation failed for ${targetUser.name}. The AI returned an empty response.`);
                }

                const targetUserId = isClinicWideSummary ? requestingUser._id : targetUser._id;
                const existingSummary = await Summary.findOne({
                    userId: targetUserId,
                    date: targetDateStr
                });

                let savedSummary;
                if (existingSummary) {
                    savedSummary = await Summary.findByIdAndUpdate(
                        existingSummary._id,
                        { content: aiResponse },
                        { new: true }
                    );
                } else {
                    const newSummaryData = {
                        userId: targetUserId,
                        userName: isClinicWideSummary ? 'Clinic-Wide' : targetUser.name,
                        date: targetDateStr,
                        content: aiResponse,
                    };
                    savedSummary = await Summary.create(newSummaryData);
                }

                if (savedSummary) {
                    results.push(savedSummary);

                    // Log activity
                    await LogService.logActivity({
                        actor: requestingUser,
                        action: logAction,
                        entity: {
                            type: 'Summary',
                            id: savedSummary._id.toString(),
                            name: `Summary for ${savedSummary.userName} on ${targetDateStr}`
                        },
                        details: {
                            generatedForId: targetUserId.toString(),
                            replacedExisting: !!existingSummary
                        },
                        request: req,
                    });
                } else {
                    throw new Error(`Failed to save summary for ${targetUser.name}.`);
                }
            } catch (error) {
                const errorMessage = error.message;
                console.error(`CRITICAL ERROR processing summary for ${targetUser.name}:`, errorMessage, error.stack);
                return res.status(500).json({
                    message: `Error generating summary for ${targetUser.name}`,
                    error: errorMessage
                });
            }
        }

        if (requestingUser.role === 'admin') {
            return res.status(200).json({
                message: "Summaries generated successfully for all users.",
                results
            });
        } else {
            const doctorSummary = results.find(s => s.userId.toString() === requestingUser._id.toString());
            return res.status(200).json(doctorSummary);
        }

    } catch (error) {
        console.error("CRITICAL ERROR in /api/actions/generate-summary:", error.message, error.stack);
        return res.status(500).json({
            message: 'Error generating summary',
            error: error.message
        });
    }
};

exports.improveText = async (req, res) => {
    try {
        const { text, context } = req.body;

        if (typeof text !== 'string') {
            return res.status(400).json({
                message: 'Invalid input: text must be a string'
            });
        }

        const aiResponse = await improveText({ text, context });

        // Log activity
        await LogService.logActivity({
            actor: req.user,
            action: 'IMPROVE_TEXT',
            entity: {
                type: 'Text',
                id: 'text-improvement',
                name: 'Text Improvement Request'
            },
            details: {
                originalTextLength: text.length,
                context: context || 'No context provided',
                hasResponse: !!aiResponse
            },
            request: req
        });

        return res.json(aiResponse);

    } catch (error) {
        console.error("Error improving text:", error);
        return res.status(500).json({
            message: 'Error improving text',
            error: error.message
        });
    }
};
