import { test, expect, jest } from "@jest/globals"
import ProductDAO from "../../src/dao/productDAO"
import ProductController from "../../src/controllers/productController"
import express from 'express';
const app = express();
app.use(express.json());

// product used as test
const testProd ={
    model : "prodModel",
    category : "Smartphone",
    quantity : 10,
    details : "prodDetails",
    sellingPrice : 1,
    arrivalDate : "2024-05-25",}

test("registerProducts-success", async () => {
    const productController = new ProductController()
    jest.spyOn(ProductDAO.prototype, 'registerProducts').mockResolvedValue()

    const response = await productController.registerProducts(
        testProd.model,
        testProd.category,
        testProd.quantity,
        testProd.details,
        testProd.sellingPrice,
        testProd.arrivalDate// call registerProducts() method
    )
    expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledTimes(1); // check if the registerProducts method has been called once
    expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledWith( // check if the registerProducts method has been called with the correct parameters
        testProd.model,
        testProd.category,
        testProd.quantity,
        testProd.details,
        testProd.sellingPrice,
        testProd.arrivalDate
    );
    jest.clearAllMocks(); // clear all mocks
})

//____________________________________________________________________________________________________________________
// change product quantity
test("change product quantity - change product quantity with success", async () => {
    const controller = new ProductController()
    jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValueOnce(undefined);

    const newQuantity = 20
    const changeDate = "2024-05-27"

    const response = await controller.changeProductQuantity(
        testProd.model,
        newQuantity,
        changeDate
    )

    expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
    expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledWith(
        testProd.model,
        newQuantity,
        changeDate
    );

    jest.clearAllMocks();
})
//____________________________________________________________________________________________________________________

// sell product
test("sell product - sell product with success", async () => {
    const controller = new ProductController()
    jest.spyOn(ProductDAO.prototype, "sellProduct").mockResolvedValueOnce(undefined);

    const sellingQuantity = 5
    const sellingDate = "2024-05-27"
    const response = await controller.sellProduct(
        testProd.model,
        sellingQuantity,
        sellingDate
    )

    expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledTimes(1);
    expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledWith(
        testProd.model,
        sellingQuantity,
        sellingDate
    );

    jest.clearAllMocks();
})
//____________________________________________________________________________________________________________________
// get products

test("get products - get products by category with success", async () => {
    const controller = new ProductController()

    jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce(undefined);

    const response = await controller.getProducts(
        "category",
        testProd.category,
        null
    )

    expect(ProductDAO.prototype.getProducts).toHaveBeenCalledTimes(1);
    expect(ProductDAO.prototype.getProducts).toHaveBeenCalledWith(
        "category",
        testProd.category,
        null
    );

    jest.clearAllMocks();
})

test("get products - get products by model with success", async () => {
    const controller = new ProductController()

    jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce(undefined);

    const response = await controller.getProducts(
        "model",
        null,
        testProd.model
    )

    expect(ProductDAO.prototype.getProducts).toHaveBeenCalledTimes(1);
    expect(ProductDAO.prototype.getProducts).toHaveBeenCalledWith(
        "model",
        null,
        testProd.model
    );

    jest.clearAllMocks();
})
//____________________________________________________________________________________________________________________
// get available products
test("get available products - get available products by category with success", async () => {
    const controller = new ProductController()

    jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValueOnce(undefined);

    const response = await controller.getAvailableProducts(
        "category",
        testProd.category,
        null
    )

    expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
    expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledWith(
        "category",
        testProd.category,
        null
    );

    jest.clearAllMocks();
})

test("get available products - get available products by model with success", async () => {
    const controller = new ProductController()

    jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValueOnce(undefined);

    const response = await controller.getAvailableProducts(
        "model",
        null,
        testProd.model
    )

    expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
    expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledWith(
        "model",
        null,
        testProd.model
    );

    jest.clearAllMocks();
})
//____________________________________________________________________________________________________________________
// delete all products
test("delete all products - delete all products with success", async () => {
    const controller = new ProductController();
    const deleteAllProductsSpy = jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockResolvedValueOnce(true);

    const response = await controller.deleteAllProducts();

    expect(deleteAllProductsSpy).toHaveBeenCalledTimes(1);
    expect(response).toBe(true);

    jest.clearAllMocks();
});

// delete product
test("delete product - delete product with success", async () => {
    const controller = new ProductController()
    jest.spyOn(ProductDAO.prototype, "deleteProduct").mockResolvedValueOnce(true);

    const response = await controller.deleteProduct(
        testProd.model
    )

    expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledTimes(1);
    expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledWith(
        testProd.model
    );

    jest.clearAllMocks();
})



