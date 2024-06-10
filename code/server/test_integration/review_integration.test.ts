import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from 'supertest';
import { cleanup } from "../src/db/cleanup";
import { app } from "../index";

const routePath = "/ezelectronics";
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" };
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" };
const anotherCustomer = { username: "anotherCustomer", name: "another", surname: "customer", password: "anotherCustomer", role: "Customer" };
let adminCookie: string;
let customerCookie: string;
let anotherCustomerCookie: string;

const product = {
    model: "iPhone14",
    category: "Smartphone",
    quantity: 100,
    details: "Latest model",
    sellingPrice: 999.99,
    arrivalDate: "2023-01-01"
};

const review = {
    score: 5,
    comment: "Excellent product"
};

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200);
};

const postProduct = async (productInfo: any) => {
    await request(app)
        .post(`${routePath}/products`)
        .set("Cookie", adminCookie)
        .send(productInfo)
        .expect(200);
};

const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err);
                }
                resolve(res.header["set-cookie"][0]);
            });
    });
};

beforeAll(async () => {
    await postUser(admin);
    await postUser(customer);
    await postUser(anotherCustomer);
    adminCookie = await login(admin);
    customerCookie = await login(customer);
    anotherCustomerCookie = await login(anotherCustomer);
    await postProduct(product);
});

afterAll(() => {
    cleanup();
});

describe("Review routes integration tests", () => {
    describe("POST /reviews/:model", () => {
        test("It should add a review for a product and return 200", async () => {
            await request(app)
                .post(`${routePath}/reviews/${product.model}`)
                .set("Cookie", customerCookie)
                .send(review)
                .expect(200);
        });

        test("It should return 422 if a required field is missing", async () => {
            await request(app)
                .post(`${routePath}/reviews/${product.model}`)
                .set("Cookie", customerCookie)
                .send({ ...review, score: "" })
                .expect(422);
        });

        test("It should return 404 if the product does not exist", async () => {
            await request(app)
                .post(`${routePath}/reviews/NonExistentProduct`)
                .set("Cookie", customerCookie)
                .send(review)
                .expect(404);
        });

        test("It should return 409 if the review already exists for the product by the same user", async () => {
            await request(app)
                .post(`${routePath}/reviews/${product.model}`)
                .set("Cookie", customerCookie)
                .send(review)
                .expect(409);
        });
    });
//______________________________________________________________________________________________________________________
    describe("GET /reviews/:model", () => {
        test("It should return an array of reviews for a product", async () => {
            const response = await request(app)
                .get(`${routePath}/reviews/${product.model}`)
                .set("Cookie", customerCookie)
                .expect(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].comment).toBe("Excellent product");
        });
    });
//______________________________________________________________________________________________________________________
    describe("DELETE /reviews/:model", () => {
        test("It should delete a review made by a user for a product and return 200", async () => {
            await request(app)
                .delete(`${routePath}/reviews/${product.model}`)
                .set("Cookie", customerCookie)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/reviews/${product.model}`)
                .set("Cookie", customerCookie)
                .expect(200);
            expect(response.body).toHaveLength(0);
        });

        test("It should return 404 if the product does not exist", async () => {
            await request(app)
                .delete(`${routePath}/reviews/NonExistentProduct`)
                .set("Cookie", customerCookie)
                .expect(404);
        });

        test("It should return 404 if the user does not have a review for the product", async () => {
            await request(app)
                .delete(`${routePath}/reviews/${product.model}`)
                .set("Cookie", anotherCustomerCookie)
                .expect(404);
        });
    });
//______________________________________________________________________________________________________________________
    describe("DELETE /reviews/:model/all", () => {
        test("It should delete all reviews of a product and return 200", async () => {
            // Add a review again for this test
            await request(app)
                .post(`${routePath}/reviews/${product.model}`)
                .set("Cookie", customerCookie)
                .send(review)
                .expect(200);

            await request(app)
                .delete(`${routePath}/reviews/${product.model}/all`)
                .set("Cookie", adminCookie)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/reviews/${product.model}`)
                .set("Cookie", customerCookie)
                .expect(200);
            expect(response.body).toHaveLength(0);
        });

        test("It should return 404 if the product does not exist", async () => {
            await request(app)
                .delete(`${routePath}/reviews/NonExistentProduct/all`)
                .set("Cookie", adminCookie)
                .expect(404);
        });
    });
//______________________________________________________________________________________________________________________
    describe("DELETE /reviews", () => {
        test("It should delete all reviews of all products and return 200", async () => {
            // Add a review again for this test
            await request(app)
                .post(`${routePath}/reviews/${product.model}`)
                .set("Cookie", customerCookie)
                .send(review)
                .expect(200);

            await request(app)
                .delete(`${routePath}/reviews`)
                .set("Cookie", adminCookie)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/reviews/${product.model}`)
                .set("Cookie", customerCookie)
                .expect(200);
            expect(response.body).toHaveLength(0);
        });
    });
});
