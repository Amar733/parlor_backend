const StockTransaction = require('../models/StockTransaction');
const Store = require('../models/Store');
const mongoose = require('mongoose');

// Get stock by store and product
exports.getStockByStoreAndProduct = async (req, res) => {
  try {
    const { storeId, productId } = req.params;
    
    const transactions = await StockTransaction.find({
      store: storeId,
      product: productId
    });
    
    let totalStock = 0;
    transactions.forEach(transaction => {
      if (transaction.transactionType === 'IN' || transaction.transactionType === 'TRANSFER_IN') {
        totalStock += transaction.qty;
      } else if (transaction.transactionType === 'OUT' || transaction.transactionType === 'TRANSFER_OUT') {
        totalStock -= transaction.qty;
      }
    });
    
    res.json({ 
      success: true, 
      data: { 
        storeId, 
        productId, 
        availableStock: totalStock 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get stock of a product across all stores
exports.getStockByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const transactions = await StockTransaction.find({ product: productId })
      .populate('store', 'name');
    
    if (transactions.length === 0) {
      const allStores = await Store.find();
      const storesWithZeroStock = allStores.map(store => ({
        storeId: store._id.toString(),
        storeName: store.name,
        stock: 0
      }));
      
      return res.json({ 
        success: true, 
        message: 'No stock found for this product',
        data: { 
          productId, 
          stores: storesWithZeroStock 
        } 
      });
    }
    
    // Get all stores first
    const allStores = await Store.find();
    const storeStockMap = {};
    
    // Initialize all stores with 0 stock
    allStores.forEach(store => {
      storeStockMap[store._id.toString()] = {
        storeId: store._id.toString(),
        storeName: store.name,
        stock: 0
      };
    });
    
    // Update stock based on transactions
    transactions.forEach(transaction => {
      const storeId = transaction.store._id.toString();
      
      if (transaction.transactionType === 'IN' || transaction.transactionType === 'TRANSFER_IN') {
        storeStockMap[storeId].stock += transaction.qty;
      } else if (transaction.transactionType === 'OUT' || transaction.transactionType === 'TRANSFER_OUT') {
        storeStockMap[storeId].stock -= transaction.qty;
      }
    });
    
    const storeStockData = Object.values(storeStockMap);
    
    res.json({ 
      success: true, 
      message: 'Stock found for this product',
      data: { 
        productId, 
        stores: storeStockData 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.transferStock = async (req, res) => {
  try {
    const { fromStoreId, toStoreId, productId, qty, notes } = req.body;
    
    if (!fromStoreId || !toStoreId || !productId || !qty) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Check available stock in source store
    const transactions = await StockTransaction.find({
      store: fromStoreId,
      product: productId
    });
    
    let availableStock = 0;
    transactions.forEach(transaction => {
      if (transaction.transactionType === 'IN' || transaction.transactionType === 'TRANSFER_IN') {
        availableStock += transaction.qty;
      } else if (transaction.transactionType === 'OUT' || transaction.transactionType === 'TRANSFER_OUT') {
        availableStock -= transaction.qty;
      }
    });
    
    if (availableStock < qty) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock. Available: ${availableStock}, Requested: ${qty}` 
      });
    }
    
    // Get store names for reference
    const fromStore = await Store.findById(fromStoreId);
    const toStore = await Store.findById(toStoreId);
    
    // Create TRANSFER_OUT transaction for source store
    await StockTransaction.create({
      product: productId,
      transactionType: 'TRANSFER_OUT',
      qty: qty,
      store: fromStoreId,
      reference: `Transfer to Store: ${toStore?.name || toStoreId}`,
      createdBy: req.user?.id,
      notes: notes
    });
    
    // Create TRANSFER_IN transaction for destination store
    await StockTransaction.create({
      product: productId,
      transactionType: 'TRANSFER_IN',
      qty: qty,
      store: toStoreId,
      reference: `Transfer from Store: ${fromStore?.name || fromStoreId}`,
      createdBy: req.user?.id,
      notes: notes
    });
    
    res.json({ 
      success: true, 
      message: 'Stock transferred successfully',
      data: {
        fromStoreId,
        toStoreId,
        productId,
        qty,
        availableStockBefore: availableStock,
        availableStockAfter: availableStock - qty
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get all stock transactions with filters
exports.getStockTransactions = async (req, res) => {
  try {
    const { 
      transactionType, 
      productId, 
      storeId, 
      startDate, 
      endDate, 
      productName,
      page = 1,
      limit = 50
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (transactionType) {
      filter.transactionType = transactionType;
    }
    
    if (productId) {
      filter.product = productId;
    }
    
    if (storeId) {
      filter.store = storeId;
    }
    
    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate);
    }

    // Build aggregation pipeline for product name search
    let pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $lookup: {
          from: 'stores',
          localField: 'store',
          foreignField: '_id',
          as: 'storeDetails'
        }
      },
      { $unwind: '$productDetails' },
      { $unwind: '$storeDetails' }
    ];

    // Add product name filter if provided
    if (productName) {
      pipeline.push({
        $match: {
          'productDetails.productName': { $regex: productName, $options: 'i' }
        }
      });
    }

    // Add sorting and pagination
    pipeline.push(
      { $sort: { transactionDate: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    );

    const transactions = await StockTransaction.aggregate(pipeline);

    // Get total count for pagination
    const totalPipeline = [...pipeline.slice(0, -2)];
    totalPipeline.push({ $count: 'total' });
    const totalResult = await StockTransaction.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Delete stock transaction
exports.deleteStockTransaction = async (req, res) => {
  try {
    const transaction = await StockTransaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Stock transaction not found' });
    }
    res.json({ success: true, message: 'Stock transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get stock overview - stores first, then products by store
exports.getStockOverview = async (req, res) => {
  try {
    const { storeId, stockFilter, page = 1, limit = 50, search, typeFilter } = req.query;
    
    if (!storeId) {
      // Return all stores with summary
      const stores = await Store.find();
      const storeData = [];
      
      for (const store of stores) {
        const pipeline = [
          { $match: { store: store._id } },
          {
            $lookup: {
              from: 'products',
              localField: 'product',
              foreignField: '_id',
              as: 'productInfo'
            }
          },
          { $unwind: '$productInfo' }
        ];
        
        // Add type filter if specified
        if (typeFilter && (typeFilter === 'Product' || typeFilter === 'Service')) {
          pipeline.push({
            $match: { 'productInfo.type': typeFilter }
          });
        }
        
        pipeline.push(
          {
            $group: {
              _id: '$product',
              productType: { $first: '$productInfo.type' },
              totalIn: {
                $sum: {
                  $cond: [
                    { $in: ['$transactionType', ['IN', 'TRANSFER_IN']] },
                    '$qty',
                    0
                  ]
                }
              },
              totalOut: {
                $sum: {
                  $cond: [
                    { $in: ['$transactionType', ['OUT', 'TRANSFER_OUT']] },
                    '$qty',
                    0
                  ]
                }
              },
              sellingPrice: { $first: '$productInfo.sellingPrice' }
            }
          },
          {
            $addFields: {
              currentStock: { $subtract: ['$totalIn', '$totalOut'] },
              stockValue: {
                $cond: [
                  { $eq: ['$productType', 'Service'] },
                  0,
                  { $multiply: [{ $subtract: ['$totalIn', '$totalOut'] }, '$sellingPrice'] }
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              totalProducts: {
                $sum: {
                  $cond: [{ $eq: ['$productType', 'Product'] }, 1, 0]
                }
              },
              totalServices: {
                $sum: {
                  $cond: [{ $eq: ['$productType', 'Service'] }, 1, 0]
                }
              },
              totalQuantity: { $sum: '$currentStock' },
              totalValue: { $sum: '$stockValue' }
            }
          }
        );
        
        const storeStats = await StockTransaction.aggregate(pipeline);
        const stats = storeStats[0] || { totalProducts: 0, totalServices: 0, totalQuantity: 0, totalValue: 0 };
        
        storeData.push({
          storeId: store._id,
          storeName: store.name,
          storeAddress: store.address,
          totalProducts: stats.totalProducts,
          totalServices: stats.totalServices,
          totalQuantity: stats.totalQuantity,
          totalValue: Math.round(stats.totalValue * 100) / 100
        });
      }
      
      return res.json({
        success: true,
        data: {
          type: 'stores',
          stores: storeData
        }
      });
    }
    
    // Return products for specific store with today's changes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const pipeline = [
      { $match: { store: new mongoose.Types.ObjectId(storeId) } },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'productInfo.category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$product',
          productName: { $first: '$productInfo.productName' },
          categoryName: { $first: { $arrayElemAt: ['$categoryInfo.categoryName', 0] } },
          mrp: { $first: '$productInfo.mrp' },
          sellingPrice: { $first: '$productInfo.sellingPrice' },
          minStockThreshold: { $first: '$productInfo.minStockThreshold' },
          totalIn: {
            $sum: {
              $cond: [
                { $in: ['$transactionType', ['IN', 'TRANSFER_IN']] },
                '$qty',
                0
              ]
            }
          },
          totalOut: {
            $sum: {
              $cond: [
                { $in: ['$transactionType', ['OUT', 'TRANSFER_OUT']] },
                '$qty',
                0
              ]
            }
          },
          todayIn: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$transactionType', ['IN', 'TRANSFER_IN']] },
                    { $gte: ['$transactionDate', today] },
                    { $lt: ['$transactionDate', tomorrow] }
                  ]
                },
                '$qty',
                0
              ]
            }
          },
          todayOut: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$transactionType', ['OUT', 'TRANSFER_OUT']] },
                    { $gte: ['$transactionDate', today] },
                    { $lt: ['$transactionDate', tomorrow] }
                  ]
                },
                '$qty',
                0
              ]
            }
          },
          lastTransaction: { $max: '$transactionDate' }
        }
      },
      {
        $addFields: {
          currentStock: { $subtract: ['$totalIn', '$totalOut'] },
          todayChange: { $subtract: ['$todayIn', '$todayOut'] },
          isLowStock: { $lt: [{ $subtract: ['$totalIn', '$totalOut'] }, '$minStockThreshold'] },
          stockValue: { $multiply: [{ $subtract: ['$totalIn', '$totalOut'] }, '$sellingPrice'] }
        }
      },
      { $sort: { productName: 1 } }
    ];
    
    // Get all products for the store (including those with no transactions)
    const Product = require('../models/Product');
    const allProducts = await Product.find()
      .populate('category', 'categoryName')
      .lean();
    
    const transactionProducts = await StockTransaction.aggregate(pipeline);
    const transactionMap = {};
    
    transactionProducts.forEach(item => {
      transactionMap[item._id.toString()] = item;
    });
    
    // Combine all products with transaction data
    let allProductsWithStock = allProducts.map(product => {
      const transactionData = transactionMap[product._id.toString()];
      const currentStock = transactionData ? transactionData.currentStock : 0;
      const isLowStock = currentStock <= (product.minStockThreshold || 0);
      const isSoldOut = currentStock === 0;
      
      // For services, override stock-related flags
      const isService = product.type === 'Service';
      const finalIsLowStock = isService ? false : isLowStock;
      const finalIsSoldOut = isService ? false : isSoldOut;
      
      return {
        productId: product._id,
        productName: product.productName,
        categoryName: product.category?.categoryName || 'Uncategorized',
        type: product.type || 'Product',
        currentStock: isService ? 'N/A' : currentStock,
        mrp: product.mrp || 0,
        sellingPrice: product.sellingPrice || 0,
        stockValue: isService ? 0 : Math.round((currentStock * (product.sellingPrice || 0)) * 100) / 100,
        minStockThreshold: product.minStockThreshold || 0,
        isLowStock: finalIsLowStock,
        isSoldOut: finalIsSoldOut,
        todayIncrease: transactionData ? transactionData.todayIn : 0,
        todayDecrease: transactionData ? transactionData.todayOut : 0,
        todayNetChange: transactionData ? transactionData.todayChange : 0,
        lastTransaction: transactionData ? transactionData.lastTransaction : null
      };
    });
    
    // Apply search filter
    if (search) {
      allProductsWithStock = allProductsWithStock.filter(product => 
        product.productName.toLowerCase().includes(search.toLowerCase()) ||
        product.categoryName.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply type filter
    if (typeFilter && (typeFilter === 'Product' || typeFilter === 'Service')) {
      allProductsWithStock = allProductsWithStock.filter(p => p.type === typeFilter);
    }
    
    // Apply stock status filter
    if (stockFilter) {
      switch (stockFilter) {
        case 'available':
          allProductsWithStock = allProductsWithStock.filter(p => 
            (p.type === 'Service') || (p.currentStock > 0 && !p.isLowStock)
          );
          break;
        case 'lowstock':
          allProductsWithStock = allProductsWithStock.filter(p => 
            p.type === 'Product' && p.isLowStock && p.currentStock > 0
          );
          break;
        case 'soldout':
          allProductsWithStock = allProductsWithStock.filter(p => 
            p.type === 'Product' && p.isSoldOut
          );
          break;
        case 'all':
        default:
          // Show all products
          break;
      }
    }
    
    // Apply pagination
    const total = allProductsWithStock.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProducts = allProductsWithStock.slice(startIndex, endIndex);
    
    const formattedProducts = paginatedProducts;
    
    res.json({
      success: true,
      data: {
        type: 'products',
        storeId,
        products: formattedProducts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        },
        summary: {
          totalProducts: allProductsWithStock.length,
          totalServices: allProductsWithStock.filter(p => p.type === 'Service').length,
          availableProducts: allProductsWithStock.filter(p => 
            (p.type === 'Service') || (p.currentStock > 0 && !p.isLowStock)
          ).length,
          lowStockItems: allProductsWithStock.filter(p => 
            p.type === 'Product' && p.isLowStock && p.currentStock > 0
          ).length,
          soldOutItems: allProductsWithStock.filter(p => 
            p.type === 'Product' && p.isSoldOut
          ).length,
          totalStockValue: allProductsWithStock.reduce((sum, p) => sum + (p.stockValue || 0), 0),
          todayTotalIncrease: allProductsWithStock.reduce((sum, p) => sum + p.todayIncrease, 0),
          todayTotalDecrease: allProductsWithStock.reduce((sum, p) => sum + p.todayDecrease, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get stock transfer history (TRANSFER_IN and TRANSFER_OUT only)
exports.getStockTransfers = async (req, res) => {
  try {
    const { 
      productId, 
      storeId, 
      startDate, 
      endDate, 
      productName,
      page = 1,
      limit = 50
    } = req.query;
    // Build filter for transfer transactions only
    const filter = {
      transactionType: { $in: ['TRANSFER_IN', 'TRANSFER_OUT'] }
    };
    
    if (productId) {
      filter.product = new mongoose.Types.ObjectId(productId);
    }
    
    if (storeId) {
      filter.store = new mongoose.Types.ObjectId(storeId);
    }
    
    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate);
    }

    console.log('Filter applied:', JSON.stringify(filter, null, 2));

    // Build aggregation pipeline
    let pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $lookup: {
          from: 'stores',
          localField: 'store',
          foreignField: '_id',
          as: 'storeDetails'
        }
      },
      { $unwind: '$productDetails' },
      { $unwind: '$storeDetails' }
    ];

    // Add product name filter if provided
    if (productName) {
      pipeline.push({
        $match: {
          'productDetails.productName': { $regex: productName, $options: 'i' }
        }
      });
    }

    // Add sorting and pagination
    pipeline.push(
      { $sort: { transactionDate: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    );

    const transfers = await StockTransaction.aggregate(pipeline);

    // Get total count for pagination
    const totalPipeline = [...pipeline.slice(0, -2)];
    totalPipeline.push({ $count: 'total' });
    const totalResult = await StockTransaction.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        transfers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};