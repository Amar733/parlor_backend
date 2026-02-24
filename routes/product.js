// routes/routes.js
const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { auth, authorize } = require('../middleware/auth');

/* --------- CATEGORY ------------------- */
router.get("/categories", auth, productController.getCategories);
router.post("/categories", auth, productController.addCategory);
router.post("/categories/bulk", productController.addCategoryBulk);
router.put("/categories/:id", auth, productController.updateCategory);
router.delete("/categories/:id", auth, productController.deleteCategory);
router.delete("/categories", auth, productController.deleteAllCategories);
router.patch("/categories/:id/status", auth, productController.toggleCategoryStatus);

/* ------------------- BRAND ------------------- */
router.get("/brands", auth, productController.getBrands);
router.post("/brands", auth, productController.addBrand);
router.post("/brands/bulk", productController.addBrandBulk);
router.put("/brands/:id", auth, productController.updateBrand);
router.delete("/brands/:id", auth, productController.deleteBrand);
router.patch("/brands/:id/status", auth, productController.toggleBrandStatus);

/* ------------------- UNIT ------------------- */
router.get("/units", auth, productController.getUnits);
router.post("/units", auth, productController.addUnit);
router.post("/units/bulk", productController.addUnitBulk);
router.put("/units/:id", auth, productController.updateUnit);
router.delete("/units/:id", auth, productController.deleteUnit);
router.patch("/units/:id/status", auth, productController.toggleUnitStatus);

/* ------------------- STORE ------------------- */
router.get("/stores", auth, productController.getStores);
router.post("/stores", auth, productController.createStore);
router.get("/stores/:id", auth, productController.getStoreById);
router.put("/stores/:id", auth, productController.updateStore);
router.delete("/stores/:id", auth, productController.deleteStore);

/* ------------------- PRODUCT ------------------- */
router.get("/products", auth, productController.getProducts);
router.get("/products/with-stock", auth, productController.getProductsWithStock);
router.get("/products/:id", auth, productController.getProductById);
router.post("/products", auth, productController.addProduct);
router.post("/products/bulk", productController.addProductBulk);
router.put("/products/:id", auth, productController.updateProduct);
router.delete("/products/:id", auth, productController.deleteProduct);
router.delete("/products", productController.deleteAllProducts);
router.patch("/products/:id/status", auth, productController.toggleProductStatus);

module.exports = router;
