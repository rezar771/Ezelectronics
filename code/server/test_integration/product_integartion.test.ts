import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { cleanup } from "../src/db/cleanup"
import { app } from "../index"

const routePath = "/ezelectronics";
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" };
let adminCookie: string;

const product = {
    model: "iPhone14",
    category: "Smartphone",
    quantity: 100,
    details: "Latest model",
    sellingPrice: 999.99,
    arrivalDate: "2023-01-01"
};
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}
const postProduct = async (productInfo: any) => {
    await request(app)
        .post(`${routePath}/products`)
        .set("Cookie", adminCookie)
        .send(product)
        .expect(200);
}
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                console.log(res.header["set-cookie"])
                resolve(res.header["set-cookie"][0])
            })

    })
}
beforeAll(async () => {
    //cleanup()
    await postUser(admin)
    adminCookie = await login(admin)

    await postProduct(product)


})

//After executing tests, we remove everything from our test database
afterAll(() => {
    cleanup()
})

describe("Product routes integration tests", () => {
    describe("POST /products", () => {
        test("It should create a new product and return 200", async () => {

            const products = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .expect(200);
            expect(products.body).toHaveLength(1);
        });

        test("It should return 422 if a required field is missing", async () => {
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send({ ...product, model: "" })
                .expect(422);
        });
        test("It should return 409 if the product model already exists", async () => {
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product)
                .expect(409);
        });
        test("It should return 400 if the arrival date is after the current date", async () => {
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send({ ...product, model: "iPhone15", arrivalDate: "2025-01-01" })
                .expect(400);
        });
    });
//____________________________________________________________________________________________________________________
    describe("PATCH /products/:model", () => {
        test("It should increase product quantity and return 200", async () => {

            const response = await request(app)
                .patch(`${routePath}/products/iPhone14`)
                .set("Cookie", adminCookie)
                .send({ quantity: 50 })
                .expect(200);
            expect(response.body.quantity).toBe(150);
        });
        test("It should return 404 if the product does not exist", async () => {
            await request(app)
                .patch(`${routePath}/products/NonExistentProduct`)
                .set("Cookie", adminCookie)
                .send({ quantity: 50 })
                .expect(404);
        });
        /*        test("It should return 400 if the change date is after the current date", async () => {
                    await request(app)
                        .patch(`${routePath}/products/iPhone14`)
                        .set("Cookie", adminCookie)
                        .send({ quantity: 50, changeDate: "2024-01-01" })
                        .expect(400);
                });*/

        test("It should return 400 if the change date is before the product's arrival date", async () => {
            await request(app)
                .patch(`${routePath}/products/iPhone14`)
                .set("Cookie", adminCookie)
                .send({ quantity: 50, changeDate: "2022-12-31" })
                .expect(400);
        });

    });
//____________________________________________________________________________________________________________________
    describe("PATCH /products/:model/sell", () => {
        test("It should decrease product quantity and return 200", async () => {

            const response = await request(app)
                .patch(`${routePath}/products/iPhone14/sell`)
                .set("Cookie", adminCookie)
                .send({ quantity: 20 })
                .expect(200);
            expect(response.body.quantity).toBe(130);
        });
        test("It should return 404 if the product does not exist", async () => {
            await request(app)
                .patch(`${routePath}/products/NonExistentProduct/sell`)
                .set("Cookie", adminCookie)
                .send({ quantity: 20 })
                .expect(404);
        });

        /*        test("It should return 400 if the selling date is after the current date", async () => {
                    await request(app)
                        .patch(`${routePath}/products/iPhone14/sell`)
                        .set("Cookie", adminCookie)
                        .send({ quantity: 20, sellingDate: "2024-01-01" })
                        .expect(400);
                });*/
        test("It should return 400 if the selling date is before the product's arrival date", async () => {
            await request(app)
                .patch(`${routePath}/products/iPhone14/sell`)
                .set("Cookie", adminCookie)
                .send({ quantity: 20, sellingDate: "2022-12-31" })
                .expect(400);
        });

        test("It should return 409 if the product's available quantity is 0", async () => {
            await request(app)
                .patch(`${routePath}/products/iPhone14/sell`)
                .set("Cookie", adminCookie)
                .send({ quantity: 150 })
                .expect(409);
        });
        test("It should return 409 if the requested quantity is higher than available quantity", async () => {
            await request(app)
                .patch(`${routePath}/products/iPhone14/sell`)
                .set("Cookie", adminCookie)
                .send({ quantity: 200 })
                .expect(409);
        });
    });
//____________________________________________________________________________________________________________________
    describe("GET /products", () => {
        test("It should return an array of products", async () => {

            const response = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .expect(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].model).toBe("iPhone14");
        });

    });
//____________________________________________________________________________________________________________________
    describe("DELETE /products/:model", () => {
        test("It should delete a product and return 200", async () => {

            await request(app)
                .delete(`${routePath}/products/iPhone14`)
                .set("Cookie", adminCookie)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .expect(200);
            expect(response.body).toHaveLength(0);
        });
        test("It should return 404 if the product does not exist", async () => {
            await request(app)
                .delete(`${routePath}/products/NonExistentProduct`)
                .set("Cookie", adminCookie)
                .expect(404);
        });
    });
});
