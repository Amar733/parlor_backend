const Charge = require('../models/Utility');
const mongoose = require('mongoose');
const { EJSON } = require('bson');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'json');

/**
 * CREATE
 */
exports.createCharge = async (req, res) => {
  try {
    const { name, charge, active } = req.body;

    const newCharge = await Charge.create({
      name,
      charge,
      active,
    });

    res.status(201).json({
      success: true,
      data: newCharge,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * READ (ALL)
 */
exports.getCharges = async (req, res) => {
  try {
    const charges = await Charge.find();

    res.status(200).json({
      success: true,
      count: charges.length,
      data: charges,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * READ (BY ID)
 */
exports.getChargeById = async (req, res) => {
  try {
    const charge = await Charge.findById(req.params.id);

    if (!charge) {
      return res.status(404).json({
        success: false,
        message: 'Charge not found',
      });
    }

    res.status(200).json({
      success: true,
      data: charge,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * UPDATE
 */
exports.updateCharge = async (req, res) => {
  try {
    const updatedCharge = await Charge.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCharge) {
      return res.status(404).json({
        success: false,
        message: 'Charge not found',
      });
    }

    res.status(200).json({
      success: true,
      data: updatedCharge,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE
 */
exports.deleteCharge = async (req, res) => {
  try {
    const deletedCharge = await Charge.findByIdAndDelete(req.params.id);

    if (!deletedCharge) {
      return res.status(404).json({
        success: false,
        message: 'Charge not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Charge deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * LIST BACKUPS
 */
exports.listBackups = async (req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file !== '.DS_Store' && (file.endsWith('.json') || file.endsWith('.zip')))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({
      success: true,
      count: files.length,
      data: files
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DOWNLOAD BACKUP
 */
exports.downloadBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // If it's already a zip, serve it directly
    if (filename.endsWith('.zip')) {
      return res.download(filePath);
    }

    // If it's a legacy JSON, zip it on the fly
    if (filename.endsWith('.json')) {
      const zip = new AdmZip();
      zip.addLocalFile(filePath, '', 'data.json');
      const zipBuffer = zip.toBuffer();
      const downloadName = filename.replace('.json', '.zip');

      res.set('Content-Type', 'application/zip');
      res.set('Content-Disposition', `attachment; filename=${downloadName}`);
      return res.send(zipBuffer);
    }

    res.download(filePath);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPLOAD BACKUP
 */
exports.uploadBackup = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.json({ success: true, message: 'Backup uploaded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE BACKUP
 */
exports.deleteBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(BACKUP_DIR, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: 'Backup deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * RESTORE BACKUP
 */
exports.restoreBackup = async (req, res) => {
  let session = null;
  try {
    const { filename } = req.params;
    const { confirm } = req.body;

    // Security & Validation
    if (!confirm || confirm !== true) {
      return res.status(400).json({ 
        success: false, 
        message: 'Destructive action detected. Please provide "confirm": true in the request body to proceed.' 
      });
    }

    // Prevent Path Traversal
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return res.status(400).json({ success: false, message: 'Invalid filename format' });
    }

    const filePath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Backup file not found' });
    }

    // Read & Parse Backup File
    let fileContent;
    if (filename.endsWith('.zip')) {
      const zip = new AdmZip(filePath);
      const zipEntries = zip.getEntries();
      const dataEntry = zipEntries.find(entry => entry.entryName === 'data.json');
      if (!dataEntry) {
        return res.status(400).json({ success: false, message: 'Invalid backup: data.json not found in zip' });
      }
      fileContent = zip.readAsText(dataEntry);
    } else {
      fileContent = fs.readFileSync(filePath, 'utf8');
    }

    // Trust EJSON to handle types (ObjectId, Date) correctly
    const backupData = EJSON.parse(fileContent);

    if (!backupData || typeof backupData !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid backup format' });
    }

    // Admin Preservation Logic
    const currentAdminId = req.user._id;
    const ManagedUser = require('../models/ManagedUser');

    // Fetch current admin data BEFORE transaction starts
    const currentAdminUser = await ManagedUser.findById(currentAdminId).lean();

    console.log(`[Restore] Preserving Admin: ${currentAdminUser?.email}`);

    // RESTORE EXECUTION (With Replica Set Fallback)
    session = await mongoose.startSession();

    const performRestoreOperation = async (currentSession) => {
      // Clear Existing Data
      console.log('[Restore] Clearing existing collections...');
      const existingCollections = await mongoose.connection.db.listCollections().toArray();
      for (const collection of existingCollections) {
        if (collection.name.startsWith('system.')) continue;
        await mongoose.connection.db.collection(collection.name).deleteMany({}, { session: currentSession });
      }

      // Restore Data from Backup
      let collectionsRestored = 0;
      let totalDocs = 0;
      const restorationStats = {};

      for (const [collectionName, data] of Object.entries(backupData)) {
        if (collectionName.startsWith('system.')) continue;

        if (data && data.length > 0) {
          await mongoose.connection.db.collection(collectionName).insertMany(data, { session: currentSession });
          totalDocs += data.length;
          restorationStats[collectionName] = data.length;
        } else {
          restorationStats[collectionName] = 0;
        }
        collectionsRestored++;
      }

      // Restore Preserved Admin (if missing)
      if (currentAdminUser) {
        const adminInRestored = await ManagedUser.findById(currentAdminId).session(currentSession);
        if (!adminInRestored) {
          console.log('[Restore] Re-inserting missing admin user...');
          await mongoose.connection.db.collection('users').insertOne(currentAdminUser, { session: currentSession });
          restorationStats['users'] = (restorationStats['users'] || 0) + 1;
        }
      }

      return { collectionsRestored, totalDocs, restorationStats };
    };

    let result;
    try {
      // Attempt Transactional Restore
      session.startTransaction();
      console.log('[Restore] Attempting Transactional Restore...');

      result = await performRestoreOperation(session);

      await session.commitTransaction();
      console.log('[Restore] Transaction Committed Successfully');

    } catch (transactionError) {
      // Check for "Standalone" error
      const isReplicaSetError = transactionError.message.includes('Transaction numbers are only allowed on a replica set') || 
                                transactionError.code === 20;

      if (isReplicaSetError) {
        console.warn('[Restore] Standalone MongoDB detected. Falling back to non-transactional restore.');
        console.warn('[Restore] WARNING: This operation is not atomic. Do not interrupt.');

        try { await session.abortTransaction(); } catch (e) { /* ignore */ }

        // RETRY: Run without transaction
        result = await performRestoreOperation(null);

      } else {
        await session.abortTransaction();
        throw transactionError;
      }
    }

    res.json({ 
      success: true, 
      message: `Database restored successfully: ${result.collectionsRestored} collections, ${result.totalDocs} documents.`,
      details: {
        collections: result.collectionsRestored,
        documents: result.totalDocs,
        adminPreserved: !!currentAdminUser,
        breakdown: result.restorationStats
      }
    });

  } catch (error) {
    console.error('[Restore] Operation failed:', error);
    res.status(500).json({ success: false, message: `Restore failed: ${error.message}` });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

/**
 * DATABASE BACKUP (JSON & ZIP)
 */
exports.runBackup = async (req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const collections = await mongoose.connection.db.listCollections().toArray();
    const backupData = {};

    for (const collection of collections) {
      const data = await mongoose.connection.db.collection(collection.name).find({}).toArray();
      console.log(`Backing up ${collection.name}: ${data.length} documents`);
      backupData[collection.name] = data;
    }

    const jsonContent = EJSON.stringify(backupData, { indent: true });
    const zip = new AdmZip();
    zip.addFile('data.json', Buffer.from(jsonContent, 'utf8'));

    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
    const filePath = path.join(BACKUP_DIR, filename);

    zip.writeZip(filePath);

    res.json({ 
      success: true, 
      message: 'ZIP Backup created successfully',
      filename 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
