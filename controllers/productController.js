// controllers/productController.js
const Product = require("../models/Product");
const Category = require("../models/Category");
const Brand = require("../models/Brand");
const Unit = require("../models/Unit");
const Store = require("../models/Store");
const StockTransaction = require("../models/StockTransaction");

/* ------------------- CATEGORY ------------------- */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addCategory = async (req, res) => {
  try {
    const category = new Category({ 
      categoryName: req.body.categoryName,
      parentCategory: req.body.parentCategory || null
    });
    await category.save();
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addCategoryBulk = async (req, res) => {
  try {
    const parentCategory = await Category.findOne({ old_id: req.body.parentCategory });
    
    const category = new Category({ 
      categoryName: req.body.categoryName,
      parentCategory: parentCategory ? parentCategory._id : null,
      old_id : req.body.old_id || "",
    });
    await category.save();
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { 
        categoryName: req.body.categoryName,
        parentCategory: req.body.parentCategory
      },
      { new: true }
    );
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Check if category is parent for other categories
    const childCategory = await Category.findOne({ parentCategory: categoryId });
    if (childCategory) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete: Category is a parent category." });
    }

    // Check if any product is using this category
    const product = await Product.findOne({ category: categoryId });
    if (product) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete: Category is associated with products." });
    }

    // Delete if safe
    await Category.findByIdAndDelete(categoryId);
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAllCategories = async (req, res) => {
  try {
    await Category.deleteMany({});
    res.json({ success: true, message: "All categories deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAllProducts = async (req, res) => {
  try {
    await Product.deleteMany({});
    res.json({ success: true, message: "All products deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ------------------- BRAND ------------------- */
exports.getBrands = async (req, res) => {
  try {
    const brands = await Brand.find();
    res.json({ success: true, data: brands });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addBrand = async (req, res) => {
  try {
    const brand = new Brand({ name: req.body.name });
    await brand.save();
    res.json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.addBrandBulk = async (req, res) => {
  try {
    const brand = new Brand({ name: req.body.name ,old_id : req.body.old_id || "" });
    await brand.save();
    res.json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true }
    );
    res.json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const brandId = req.params.id;

    // Check if any product is using this brand
    const product = await Product.findOne({ brand: brandId });
    if (product) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete: Brand is associated with products." });
    }

    // Delete if safe
    await Brand.findByIdAndDelete(brandId);
    res.json({ success: true, message: "Brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ------------------- UNIT ------------------- */
exports.getUnits = async (req, res) => {
  try {
    const units = await Unit.find();
    res.json({ success: true, data: units });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addUnit = async (req, res) => {
  try {
    const unit = new Unit({ name: req.body.name });
    await unit.save();
    res.json({ success: true, data: unit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addUnitBulk = async (req, res) => {
  try {
    const unit = new Unit({ name: req.body.name, old_id: req.body.old_id || "" });
    await unit.save();
    res.json({ success: true, data: unit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true }
    );
    res.json({ success: true, data: unit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteUnit = async (req, res) => {
  try {
    const unitId = req.params.id;

    // Check if any product is using this unit
    const product = await Product.findOne({ unit: unitId });
    if (product) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete: Unit is associated with products." });
    }

    // Delete if safe
    await Unit.findByIdAndDelete(unitId);
    res.json({ success: true, message: "Unit deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ------------------- STORE ------------------- */

// ✅ Create a Store
exports.createStore = async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address } = req.body;

    const store = new Store({
      name,
      contactPerson,
      phone,
      email,
      address,
    });

    await store.save();
    res.status(201).json({ success: true, data: store });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Get All Stores
exports.getStores = async (req, res) => {
  try {
    const stores = await Store.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: stores });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Single Store by ID
exports.getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    res.status(200).json({ success: true, data: store });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Store
exports.updateStore = async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address } = req.body;

    const store = await Store.findByIdAndUpdate(
      req.params.id,
      { name, contactPerson, phone, email, address },
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    res.status(200).json({ success: true, data: store });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Delete Store
exports.deleteStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    res.status(200).json({ success: true, message: 'Store deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



/* ------------------- PRODUCT ------------------- */
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, brand, unit, type, status, minPrice, maxPrice, sortBy = 'productName', sortOrder = 'asc' } = req.query;
    
    // Build query object
    const query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { hsnSac: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by brand
    if (brand) {
      query.brand = brand;
    }
    
    // Filter by unit
    if (unit) {
      query.unit = unit;
    }
    
    // Filter by type
    if (type) {
      query.type = type;
    }
    
    // Filter by status
    if (status !== undefined) {
      query.status = status === 'true';
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.sellingPrice.$lte = parseFloat(maxPrice);
    }
    
    // Sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const products = await Product.find(query)
      .populate("category", "categoryName")
      .populate("unit", "name")
      .populate("brand", "name")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Get total count for pagination
    const total = await Product.countDocuments(query);
    
    res.json({ 
      success: true, 
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category")
      .populate("unit")
      .populate("brand");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.addProductBulk = async (req, res) => {
  try {
    const category = await Category.findOne({ old_id: req.body.category });
    const unit = await Unit.findOne({ old_id: req.body.unit });
    const brand = await Brand.findOne({ old_id: req.body.brand });

    const product = new Product({
      productName: req.body.productName,
      listPrice: req.body.listPrice || 0,
      taxType: req.body.taxType || "Exclusive",
      category: category?._id,
      unit: unit?._id,
      brand: brand?._id,
      old_id: req.body.old_id || "",
      mrp: req.body.mrp,
      purchasePrice: req.body.purchasePrice,
      sellingPrice: req.body.sellingPrice,
      cgst: req.body.cgst,
      sgst: req.body.sgst,
      igst: req.body.igst,
      hsnSac: req.body.hsnSac,
      barcode: req.body.barcode || Math.floor(100000000000 + Math.random() * 900000000000).toString(),
      batchNo: req.body.batchNo,
      sku: req.body.sku,
      minStockThreshold: req.body.minStockThreshold,
      status: true,
      type: req.body.type,

      weight: req.body.weight,
      width: req.body.width,
      length: req.body.length,
      height: req.body.height,

      description: req.body.description,
      photo: req.body.photo,
      isShowcase: req.body.isShowcase,
    });

    await product.save();
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.addProduct = async (req, res) => {
  try {
    const product = new Product({
      productName: req.body.productName,
      listPrice: req.body.listPrice || 0,
      taxType: req.body.taxType || "Exclusive",
      category: req.body.category,
      unit: req.body.unit,
      brand: req.body.brand,
      type: req.body.type,
      mrp: req.body.mrp,
      purchasePrice: req.body.purchasePrice,
      sellingPrice: req.body.sellingPrice,
      cgst: req.body.cgst,
      sgst: req.body.sgst,
      igst: req.body.igst,
      hsnSac: req.body.hsnSac,
      barcode: req.body.barcode || Math.floor(100000000000 + Math.random() * 900000000000).toString(),
      batchNo: req.body.batchNo,
      sku: req.body.sku,
      minStockThreshold: req.body.minStockThreshold,

      weight: req.body.weight,
      width: req.body.width,
      length: req.body.length,
      height: req.body.height,

      description: req.body.description,
      photo: req.body.photo,
      isShowcase: req.body.isShowcase,
    });

    await product.save();
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        productName: req.body.productName,
        listPrice: req.body.listPrice || 0,
        taxType: req.body.taxType || "Exclusive",
        category: req.body.category,
        unit: req.body.unit,
        brand: req.body.brand,
        type: req.body.type,
        mrp: req.body.mrp,
        purchasePrice: req.body.purchasePrice,
        sellingPrice: req.body.sellingPrice,
        cgst: req.body.cgst,
        sgst: req.body.sgst,
        igst: req.body.igst,
        hsnSac: req.body.hsnSac,
        barcode: req.body.barcode || Math.floor(100000000000 + Math.random() * 900000000000).toString(),
        batchNo: req.body.batchNo,
        sku: req.body.sku,
        minStockThreshold: req.body.minStockThreshold,

        weight: req.body.weight,
        width: req.body.width,
        length: req.body.length,
        height: req.body.height,

        description: req.body.description,
        photo: req.body.photo,
        isShowcase: req.body.isShowcase,
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ✅ Toggle Status for Brand
exports.toggleBrandStatus = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: "Brand not found" });

    brand.status = !brand.status; // toggle
    await brand.save();

    res.json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Toggle Status for Unit
exports.toggleUnitStatus = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) return res.status(404).json({ success: false, message: "Unit not found" });

    unit.status = !unit.status; // toggle
    await unit.save();

    res.json({ success: true, data: unit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Toggle Status for Category
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    category.status = !category.status; // toggle
    await category.save();

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Toggle Status for Product
exports.toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    product.status = !product.status; // toggle
    await product.save();

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all products with stock quantities
exports.getProductsWithStock = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    
    // Build base query
    const baseQuery = {};
    
    if (search) {
      baseQuery.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      baseQuery.category = category;
    }
    
    // Get all services first
    const services = await Product.find({ ...baseQuery, type: 'Service' })
      .populate('category', 'categoryName')
      .populate('unit', 'name')
      .populate('brand', 'name')
      .sort({ productName: 1 });
    
    // Get all physical products
    const products = await Product.find({ ...baseQuery, type: 'Product' })
      .populate('category', 'categoryName')
      .populate('unit', 'name')
      .populate('brand', 'name')
      .sort({ productName: 1 });
    
    // Get all stores ordered by creation (first store priority)
    const stores = await Store.find().sort({ createdAt: 1 });
    
    // Process services (no stock calculation)
    const servicesData = services.map(service => ({
      product: service.toObject(),
      isService: true,
      totalStock: null,
      storeStock: [],
      primaryStore: null,
      availableInStores: []
    }));
    
    // Calculate stock for physical products
    const productsWithStock = await Promise.all(
      products.map(async (product) => {
        let stockInfo = {
          product: product.toObject(),
          isService: false,
          totalStock: 0,
          storeStock: [],
          primaryStore: null,
          availableInStores: []
        };
        
        // Calculate stock for each store
        for (const store of stores) {
          const transactions = await StockTransaction.find({
            product: product._id,
            store: store._id
          });
          
          let storeStockQty = 0;
          transactions.forEach(transaction => {
            if (transaction.transactionType === 'IN' || transaction.transactionType === 'TRANSFER_IN') {
              storeStockQty += transaction.qty;
            } else if (transaction.transactionType === 'OUT' || transaction.transactionType === 'TRANSFER_OUT') {
              storeStockQty -= transaction.qty;
            }
          });
          
          const storeStockData = {
            store: { _id: store._id, name: store.name },
            quantity: storeStockQty
          };
          
          stockInfo.storeStock.push(storeStockData);
          stockInfo.totalStock += storeStockQty;
          
          if (storeStockQty > 0) {
            stockInfo.availableInStores.push(storeStockData);
          }
        }
        
        if (stockInfo.availableInStores.length > 0) {
          stockInfo.primaryStore = stockInfo.availableInStores[0];
        } else if (stores.length > 0) {
          stockInfo.primaryStore = {
            store: { _id: stores[0]._id, name: stores[0].name },
            quantity: 0
          };
        }
        
        return stockInfo;
      })
    );
    
    // Filter products with stock > 0
    const availableProducts = productsWithStock.filter(item => item.totalStock > 0);
    
    // Combine: Services first, then available products
    const allItems = [...servicesData, ...availableProducts];
    
    // Apply pagination to combined results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedItems = allItems.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allItems.length / limit),
        totalItems: allItems.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
