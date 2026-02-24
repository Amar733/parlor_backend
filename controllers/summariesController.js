const Summary = require('../models/Summary');

exports.getSummaries = async (req, res) => {
    try {
        const { role } = req.user;
        const userId = req.user._id.toString();
        let summaries;
        if (role === 'admin') {
            summaries = await Summary.find().sort({ date: -1, createdAt: -1 });
        } else {
            summaries = await Summary.find({ userId: userId }).sort({ date: -1, createdAt: -1 });
        }
        const mappedSummaries = summaries.map(summary => {
            const obj = summary.toObject();
            delete obj.__v;
            return obj;
        });
        res.json(mappedSummaries);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching summaries'
        });
    }
};

exports.getSummaryById = async (req, res) => {
    try {
        const summary = await Summary.findById(req.params.id);
        if (!summary) {
            return res.status(404).json({ message: 'Summary not found' });
        }
        if (req.user.role !== 'admin' && summary.userId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        if (summary) {
            const obj = summary.toObject();
            delete obj._id;
            delete obj.__v;
            res.json(obj);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createSummary = async (req, res) => {
    try {
        const summaryData = {
            ...req.body,
            userId: req.user._id.toString(),
            userName: req.user.name
        };
        const summary = new Summary(summaryData);
        await summary.save();
        if (summary) {
            const obj = summary.toObject();
            delete obj._id;
            delete obj.__v;
            res.status(201).json(obj);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateSummary = async (req, res) => {
    try {
        const summary = await Summary.findById(req.params.id);
        if (!summary) {
            return res.status(404).json({ message: 'Summary not found' });
        }
        if (req.user.role !== 'admin' && summary.userId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const updatedSummary = await Summary.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (updatedSummary) {
            const obj = updatedSummary.toObject();
            delete obj._id;
            delete obj.__v;
            res.json(obj);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteSummary = async (req, res) => {
    try {
        const summary = await Summary.findById(req.params.id);
        if (!summary) {
            return res.status(404).json({ message: 'Summary not found' });
        }
        if (req.user.role !== 'admin' && summary.userId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        await Summary.findByIdAndDelete(req.params.id);
        res.json({ message: 'Summary deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSummariesByUserId = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const { page = 1, limit = 10, date } = req.query;
        const query = { userId: req.params.userId };
        if (date) {
            query.date = date;
        }
        const summaries = await Summary.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });
        const total = await Summary.countDocuments(query);
        const mappedSummaries = summaries.map(summary => {
            const obj = summary.toObject();
            delete obj._id;
            delete obj.__v;
            return obj;
        });
        res.json({
            summaries: mappedSummaries,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
