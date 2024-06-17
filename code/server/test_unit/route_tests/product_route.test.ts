import { test, expect, jest ,beforeEach,afterEach} from "@jest/globals"
import request from "supertest"
import { app } from "../../index"
import Authenticator from "../../src/routers/auth"
import ProductController from "../../src/controllers/productController";
const baseURL = "/ezelectronics"
import { Product ,Category} from "../../src/components/product";
jest.mock("../../src/routers/auth")
jest.mock("../../src/controllers/productController");
jest.mock("../../src/db/db")

beforeEach(() => {
    jest.clearAllMocks();
});
afterEach(() => {
    jest.resetAllMocks();  // Reset all mocks after each test
});
const testProd ={
    model : "prodModel",
    category : Category.SMARTPHONE,
    quantity : 10,
    details : "prodDetails",
    sellingPrice : 1,
    arrivalDate : "2024-05-25",}
const error = new Error("Error")

// register products test:
test("register products - 200", async () => {

    jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce() //Mock the registerProducts method of the controller
    jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementationOnce((req, res, next) => (next())) //Mock the isLoggedIn method of the Authenticator
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => (next()))
    const response = await request(app).post(baseURL + "/products").send(testProd)
    expect(response.status).toBe(200)
    expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1)
    expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith( // check if the registerProducts method has been called with the correct parameters
        testProd.model,
        testProd.category,
        testProd.quantity,
        testProd.details,
        testProd.sellingPrice,
        testProd.arrivalDate)
    jest.clearAllMocks()
})
test("register products - 503", async () => {

    jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(error) //Mock the registerProducts method of the controller
    jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementationOnce((req, res, next) => (next())) //Mock the isLoggedIn method of the Authenticator
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => (next()))
    const response = await request(app).post(baseURL + "/products").send(testProd)
    expect(response.status).toBe(503)
    expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1)
    expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith( // check if the registerProducts method has been called with the correct parameters
        testProd.model,
        testProd.category,
        testProd.quantity,
        testProd.details,
        testProd.sellingPrice,
        testProd.arrivalDate)
    jest.clearAllMocks()
})

test("register products-user not logged in-401", async () => {
    // check if the product is not registered if the user is not logged in
    jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => res.status(401).json({error: "Unauthenticated user", status: 401}))


    const response = await request(app).post(baseURL + "/products").send(testProd)

    expect(response.status).toBe(401)
    expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(0)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})
test("register products-user not a manager or admin-401", async () => {
    // check if the product is not registered if the user is not a manager
    jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => res.status(401).json({error: "User is not a manager or admin", status: 401}))
    jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()

    const response = await request(app).post(baseURL + "/products").send(testProd)

    expect(response.status).toBe(401)
    expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(0)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})
//_____________________________________________________________________________________________________________________
// change product quantity test:
test("change product quantity- 200", async () => {
    const newQuantity = 20;
    const changeDate = "2024-05-27";

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next());
    jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(newQuantity);

    const response = await request(app)
        .patch(`${baseURL}/products/${testProd.model}`)
        .send({ quantity: newQuantity, changeDate });

    expect(response.status).toBe(200);
    expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
    expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(testProd.model, newQuantity, changeDate);
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
});
test("change product quantity- 503", async () => {
    const newQuantity = 20;
    const changeDate = "2024-05-27";

    jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(error)
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next());

    const response = await request(app)
        .patch(`${baseURL}/products/${testProd.model}`)
        .send({ quantity: newQuantity, changeDate });

    expect(response.status).toBe(503);
    expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
    expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(testProd.model, newQuantity, changeDate);
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
});

test("change product quantity-user not logged in-401", async () => {
    const newQuantity = 20
    const changeDate = "2024-05-27"

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => res.status(401).json({error: "Unauthenticated user", status: 401}))
    jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(error)

    const response = await request(app).patch(baseURL + "/products/model").send({model: testProd.model, quantity: 20, changeDate: "2024-05-27"})

    expect(response.status).toBe(401)
    expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})
test("change product quantity-user not a manager or admin", async () => {

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => res.status(401).json({error: "User is not a manager or admin", status: 401}))
    jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(error)

    const response = await request(app).patch(baseURL + "/products/model").send({model: testProd.model, quantity: 20, changeDate: "2024-05-27"})

    expect(response.status).toBe(401)
    expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})
test("change product quantity- quantity is null - 422", async () => {
    const newQuantity = 0
    const changeDate = "2024-05-27"

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(error)

    const response = await request(app).patch(baseURL + "/products/model").send({model: testProd.model, quantity: newQuantity, changeDate: changeDate})

    expect(response.status).toBe(422)
    expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})
//_____________________________________________________________________________________________________________________
// sell product
test("sell product -200", async () => {
    const sellingQuantity = 1
    const sellingDate = "2024-05-27"

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(1)

    const response = await request(app).patch(baseURL + "/products/model/sell").send({model: testProd.model, quantity: sellingQuantity, date: sellingDate})
    expect(response.status).toBe(200)
    expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})
test("sell product -503", async () => {
    const sellingQuantity = 1
    const sellingDate = "2024-05-27"

    jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValue(error)
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next())

    const response = await request(app).patch(baseURL + "/products/model/sell").send({model: testProd.model, quantity: sellingQuantity, date: sellingDate})
    expect(response.status).toBe(503)
    expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})

test("sell product-user not logged in-401", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => res.status(401).json({error: "Unauthenticated user", status: 401}))
    jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(error)

    const response = await request(app).patch(baseURL + "/products/model/sell").send({model: testProd.model, quantity: 5, date: "2024-05-27"})
    expect(response.status).toBe(401)
    expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(0)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})

test("user not a manager or admin", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => res.status(401).json({error: "User is not a manager", status: 401}))
    jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(error)

    const response = await request(app).patch(baseURL + "/products/model/sell").send({model: testProd.model, quantity: 5, date: "2024-05-27"})
    expect(response.status).toBe(401)
    expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(0)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})

test("sell product - quantity is null- 422", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(error)

    const response = await request(app).patch(baseURL + "/products/model/sell").send({model: testProd.model, quantity: 0, date: "2024-05-27"})
    expect(response.status).toBe(422)
    expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(0)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})
//_____________________________________________________________________________________________________________________
// get products
test("get all products - 200", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([])  // simulate that testProd is returned

    const response = await request(app).get(baseURL + "/products")  // instead of send, use query to send the parameters
    expect(response.status).toBe(200)
    expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})
test("get all products - 503", async () => {
    jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(error)
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next())

    const response = await request(app).get(baseURL + "/products")  // instead of send, use query to send the parameters
    expect(response.status).toBe(503)
    expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})

test("get products by model -200", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next());
    jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProd]); // simulate that testProd is returned as an array

    const response = await request(app).get(`${baseURL}/products?grouping=model&model=${testProd.model}`);
    expect(response.status).toBe(200);
    expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1);
    expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("model", undefined, testProd.model); // ensure the method is called with the correct parameters
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual([testProd]); // check if the response body is equal to the array containing testProd

    jest.clearAllMocks();
});


test("get products by category-200", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProd])  // simulate that testProd is returned

    const response = await request(app).get(baseURL + `/products?grouping=category&category=${testProd.category}`)  // instead of send, use query to send the parameters
    expect(response.status).toBe(200)
    expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("category",testProd.category, undefined);
    expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)
    expect(response.body).toEqual([testProd]) // check if the response body is equal to testProd

    jest.clearAllMocks()
})


test("get products - user is not an admin or manager-401", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => res.status(401).json({error: "User is not an admin or manager", status: 401}))
    jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(error)

    const response = await request(app).get(baseURL + `/products?grouping=category&category=${testProd.category}`)
    expect(response.status).toBe(401)
    expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})

test("get products - category is null-422", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next());
    jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([]);

    const response = await request(app).get(`${baseURL}/products?grouping=category`);

    expect(response.status).toBe(422);
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
    expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);

    jest.clearAllMocks();
});

test("get products - model is null-422", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(error)

    const response = await request(app).get(baseURL + `/products?grouping=model`)    // model is null
    expect(response.status).toBe(422)
    expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})

//_____________________________________________________________________________________________________________________
// get available products
test("get available products - get available products by category with success-200", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())// user must be customer
    jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([])

    const response = await request(app).get(baseURL + `/products/available?grouping=category&category=${testProd.category}`)
    expect(response.status).toBe(200)
    expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})
test("get available products -503", async () => {

    jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(error)
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())// user must be customer
    const response = await request(app).get(baseURL + `/products/available?grouping=category&category=${testProd.category}`)
    expect(response.status).toBe(503)
    expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})

test("get available products - get available products by model with success", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([testProd])

    const response = await request(app).get(baseURL + `/products/available?grouping=model&model=${testProd.model}`)
    expect(response.status).toBe(200)
    expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
    expect(response.body).toEqual([testProd])

    jest.clearAllMocks()
})



test("get available products - not logged in", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => res.status(401).json({error: "Unauthenticated user", status: 401}))
    jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(error)

    const response = await request(app).get(baseURL + `/products/available?grouping=category&category=${testProd.category}`)
    expect(response.status).toBe(401)
    expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})

test("get available products - category is null", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(error)

    const response = await request(app).get(baseURL + `/products/available?grouping=category`)    // category is null
    expect(response.status).toBe(422)
    expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})

test("get available products - model is null", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(error)

    const response = await request(app).get(baseURL + `/products/available?grouping=model`)    // model is null
    expect(response.status).toBe(422)
    expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)


    jest.clearAllMocks()
})
//_____________________________________________________________________________________________________________________
// delete all products
test("delete all products - delete all products with success", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)

    const response = await request(app).delete(baseURL + "/products")
    expect(response.status).toBe(200)
    expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})
test("delete all products - 503", async () => {
    jest.spyOn(ProductController.prototype, "deleteAllProducts").mockRejectedValueOnce(error)
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next())
    const response = await request(app).delete(baseURL + "/products")
    expect(response.status).toBe(503)
    expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
})

test("delete all products - not logged in", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
        res.status(401).json({ error: "Unauthenticated user", status: 401 });
    });
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next());
    jest.spyOn(ProductController.prototype, "deleteAllProducts").mockRejectedValueOnce(error)

    const response = await request(app).delete(baseURL + "/products");
    expect(response.status).toBe(401);
    expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(0);
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
});

test("delete all products - not an admin or manager-401", async () => {
    const isLoggedInMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    const isAdminOrManagerMock = jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => res.status(401).json({ error: "User is not an admin or manager", status: 401 }));
    jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(false);

    const response = await request(app).delete(baseURL + "/products");
    expect(response.status).toBe(401);
    expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(0);
    expect(isLoggedInMock).toHaveBeenCalledTimes(1);
    expect(isAdminOrManagerMock).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
});
//_____________________________________________________________________________________________________________________
test("delete product - delete product with success", async () => {
    const isLoggedInMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    const isAdminOrManagerMock = jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next());
    jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true);

    const response = await request(app).delete(baseURL + `/products/${testProd.model}`);
    expect(response.status).toBe(200);
    expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1);
    expect(isLoggedInMock).toHaveBeenCalledTimes(1);
    expect(isAdminOrManagerMock).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
});
test("delete product - 503", async () => {
    const isLoggedInMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    const isAdminOrManagerMock = jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next());
    jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValueOnce(error);

    const response = await request(app).delete(baseURL + `/products/${testProd.model}`);
    expect(response.status).toBe(503);
    expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1);
    expect(isLoggedInMock).toHaveBeenCalledTimes(1);
    expect(isAdminOrManagerMock).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
});
test("delete product - not logged in", async () => {
    const isLoggedInMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => res.status(401).json({ error: "Unauthenticated user", status: 401 }));
    const isAdminOrManagerMock = jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next());
    jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true);

    const response = await request(app).delete(baseURL + `/products/${testProd.model}`);
    expect(response.status).toBe(401);
    expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(0);
    expect(isLoggedInMock).toHaveBeenCalledTimes(1);
    expect(isAdminOrManagerMock).toHaveBeenCalledTimes(0);

    jest.clearAllMocks();
});

test("delete product - not an admin or manager", async () => {
    const isLoggedInMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
    const isAdminOrManagerMock = jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => res.status(401).json({ error: "User is not an admin or manager", status: 401 }));
    jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true);

    const response = await request(app).delete(baseURL + `/products/${testProd.model}`);
    expect(response.status).toBe(401);
    expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(0);
    expect(isLoggedInMock).toHaveBeenCalledTimes(1);
    expect(isAdminOrManagerMock).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
});